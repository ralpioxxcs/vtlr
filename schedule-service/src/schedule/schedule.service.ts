import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import * as cronParser from 'cron-parser';
import { TaskService } from 'src/task/task.service';
import { ScheduleCategory, ScheduleType } from './enum/schedule.enum';
import { JobService } from 'src/job/job.service';

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly jobService: JobService,
    private readonly dataSource: DataSource,
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ScheduleModel>(ScheduleModel)
      : this.scheduleRepository;
  }

  getPriority(category: ScheduleCategory) {
    // create jobs corresponding to schedule tasks
    let priority = 0;
    if (category === ScheduleCategory.onTime) {
      priority = 0;
    } else if (category === ScheduleCategory.event) {
      priority = 1;
    } else if (category === ScheduleCategory.routine) {
      priority = 2;
    } else {
      throw new Error('Unsupported schedule category');
    }

    return priority;
  }

  async onModuleInit() {
    this.logger.debug('initializing schedules');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const entities = await qr.manager.find(ScheduleModel, {
        relations: ['tasks'],
      });

      //
      // 아래 조건을 만족하는 스케줄을 초기화 한다
      //  * 스케줄 타입이 "recurring"
      //  * 스케줄 타입이 "one_time"이면서, 아직 실행 전
      //
      const initEntities = entities.filter((entity) => {
        if (entity.type === ScheduleType.recurring) {
          this.logger.debug(`recurring schedule (id: ${entity.id})`);
          return true;
        }

        if (
          entity.type === ScheduleType.oneTime &&
          this.isCronExpired(entity.interval) === false
        ) {
          this.logger.debug(
            `schedule is not expired (cronExp: ${entity.interval}, id: ${entity.id})`,
          );
          return true;
        }
      });

      for (const entity of initEntities) {
        for (const task of entity.tasks) {
          await this.jobService.createJob(
            entity.interval,
            entity.id,
            task,
            this.getPriority(entity.category),
          );
        }
        await this.delay(100); // Job Name 생성시 타임스탬프 중복 방지를 위한 딜레이
      }

      await qr.commitTransaction();
    } catch (err) {
      this.logger.error(
        `Error occurred initializing schedules (error: ${err})`,
      );
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAllSchedules(type?: string, category?: string) {
    try {
      const rows = await this.scheduleRepository.find({
        where: {
          type: type as ScheduleType,
          category: category as ScheduleCategory,
        },
        relations: ['tasks'],
      });
      return rows;
    } catch (error) {
      this.logger.error(`Error occurred finding schedule (err: ${error})`);
      throw error;
    }
  }

  async findScheduleById(id: string) {
    try {
      const row = await this.scheduleRepository.findOne({
        where: {
          id,
        },
        relations: ['tasks'],
      });
      if (!row) {
        throw new NotFoundException('not found schedule corresponding id');
      }
      return row;
    } catch (error) {
      this.logger.error(`Error occurred finding schedule (err: ${error})`);
      throw error;
    }
  }

  private isCronExpired(cronExpression: string, referenceTime = new Date()) {
    try {
      const interval = cronParser.parseExpression(cronExpression, {
        currentDate: referenceTime,
      });
      const nextExecution = interval.next().toDate();

      const adjustedNextExecution = new Date(
        referenceTime.getFullYear(),
        nextExecution.getMonth(),
        nextExecution.getDate(),
        nextExecution.getHours(),
        nextExecution.getMinutes(),
        nextExecution.getSeconds(),
      );

      const diff = adjustedNextExecution.getTime() < referenceTime.getTime();
      return diff;
    } catch (err) {
      console.error('Invalid cron expression:', err.message);
      return false;
    }
  }

  async createSchedule(scheduleDto: CreateScheduleDto, qr?: QueryRunner) {
    const repo = this.getRepository(qr);

    try {
      //  * Schedule
      //   - Task_1
      //   - Task_2
      //   - Task_3
      //   - Task_4
      //   - ...
      
      // 하나의 Schedule 데이터를 생성한다
      const entity = repo.create({
        ...scheduleDto,
      });
      const newSchedule = await repo.save(entity);

      // 하위 여러개의 Task 데이터를 생성한다
      const tasks = await this.taskService.createTask(
        newSchedule,
        scheduleDto.task,
        qr,
      );
      newSchedule.tasks = tasks;

      for (const task of tasks) {
        await this.jobService.createJob(
          entity.interval,
          entity.id,
          task,
          this.getPriority(entity.category),
          scheduleDto.removeOnComplete || false
        );
      }

      return newSchedule;
    } catch (error) {
      this.logger.error(`Error occurred creating schedule (err: ${error})`);
      throw error;
    }
  }

  async updateSchedule(
    id: string,
    scheduleDto: UpdateScheduleDto,
  ): Promise<ScheduleModel> {
    this.logger.log(`update the schedule (id: ${id})`);

    try {
      const entity = await this.scheduleRepository.findOne({
        where: {
          id: id,
        },
      });

      if (!entity) {
        throw new NotFoundException('not found schedule corresponding id');
      }

      const updatedEntity = this.scheduleRepository.merge(entity, scheduleDto);
      await this.scheduleRepository.save(updatedEntity);

      await this.jobService.createJob(updatedEntity.interval, updatedEntity.id);

      return updatedEntity;
    } catch (error) {
      this.logger.error(`Error occurred update schedule (err: ${error})`);
      throw error;
    }
  }

  async deleteSchedule(id: string) {
    this.logger.log(`delete the schedule (id: ${id})`);

    try {
      const entity = await this.scheduleRepository.findOne({
        where: {
          id: id,
        },
      });
      if (!entity) {
        throw new NotFoundException('not found schedule corresponding id');
      }

      const result = await this.jobService.deleteJob(entity.id);
      if (!result) {
        throw Error(`failed to remove the job`);
      }

      await this.scheduleRepository.remove(entity);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
