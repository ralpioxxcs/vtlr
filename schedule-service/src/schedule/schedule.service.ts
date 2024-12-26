import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
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

@Injectable()
export class ScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly dataSource: DataSource,
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
  ) {}

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
          this.logger.debug(`recurring schedule (id: ${entity.rowId})`);
          return true;
        }

        if (
          entity.type === ScheduleType.oneTime &&
          this.isCronExpired(entity.interval) === false
        ) {
          this.logger.debug(
            `schedule is not expired (cronExp: ${entity.interval}, id: ${entity.rowId})`,
          );
          return true;
        }
      });

      for (const entity of initEntities) {
        await this.taskService.createTask(
          entity,
          entity.tasks.map((task) => {
            return {
              text: task.text,
              volume: task.volume,
              language: task.language,
            };
          }),
        );
        await this.delay(100); // CronJob Id생성시 타임스탬프 중복 방지를 위한 딜레이
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

  onModuleDestroy() {
    this.logger.debug('Clean-up');
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ScheduleModel>(ScheduleModel)
      : this.scheduleRepository;
  }

  async findAllSchedules(type?: string, category?: string) {
    this.logger.debug('find all schedules');
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
          rowId: id,
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

  async createSchedule(scheduleDto: CreateScheduleDto) {
    try {
      const entity = this.scheduleRepository.create({
        ...scheduleDto,
      });
      const newSchedule = await this.scheduleRepository.save(entity);

      const tasks = await this.taskService.createTask(
        newSchedule,
        scheduleDto.task,
      );
      newSchedule.tasks = tasks;

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
    try {
      const scheduleEntity = await this.scheduleRepository.findOne({
        where: {
          rowId: id,
        },
      });

      if (!scheduleEntity) {
        throw new NotFoundException('not found schedule corresponding id');
      }

      const mergedSchedule = this.scheduleRepository.merge(
        scheduleEntity,
        scheduleDto,
      );
      await this.scheduleRepository.save(mergedSchedule);

      return scheduleEntity;
    } catch (error) {
      this.logger.error(`Error occurred update schedule (err: ${error})`);
      throw error;
    }
  }

  async deleteSchedule(id: string) {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: {
          rowId: id,
        },
      });
      if (!schedule) {
        throw new NotFoundException('not found schedule corresponding id');
      }

      return await this.scheduleRepository.remove(schedule);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
