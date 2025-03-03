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
import { CreateTaskDto } from 'src/task/dto/task.dto';
import { JOB_PAYLOAD } from 'src/job/const/job-type.const';
import { TaskModel } from 'src/task/entites/task.entity';
import { UpdateTaskDto } from 'src/task/dto/update-task.dto';

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
    } else if (category === ScheduleCategory.task) {
      priority = 3;
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

      // 아래 조건을 만족하는 스케줄을 초기화 한다
      //  * 스케줄 타입이 "recurring"
      //  * 스케줄 타입이 "one_time"이면서, 아직 실행 전
      const initSchedules = entities.filter((entity) => {
        if (entity.type === ScheduleType.recurring) {
          this.logger.debug(`recurring schedule (id: ${entity.id}, title: ${entity.title})`);
          return true;
        }

        if (
          entity.type === ScheduleType.oneTime &&
          this.isCronExpired(entity.interval) === false
        ) {
          this.logger.debug(
            `schedule not expired (id: ${entity.id}, cron: ${entity.interval})`,
          );
          return true;
        }
      });

      for (const schedule of initSchedules) {
        await this.processSchedule(schedule, schedule.tasks);
        await this.delay(200); // Job Name 생성시 타임스탬프 중복 방지를 위한 딜레이
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
      const query = this.scheduleRepository
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.tasks', 'task');

      if (type) {
        query.where('schedule.type = :type', { type });
      }
      if (category) {
        query.andWhere('schedule.category = :category', { category });
      }
      const schedules = await query.orderBy('task.createdAt', 'ASC').getMany();

      return schedules;
    } catch (error) {
      this.logger.error(`Error occurred finding schedule (err: ${error})`);
      throw error;
    }

    // try {
    //   const rows = await this.scheduleRepository.find({
    //     where: {
    //       type: type as ScheduleType,
    //       category: category as ScheduleCategory,
    //     },
    //     relations: ['tasks'],
    //   });
    //   return rows;
    // } catch (error) {
    //   this.logger.error(`Error occurred finding schedule (err: ${error})`);
    //   throw error;
    // }
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

  async createSchedule(
    scheduleDto: CreateScheduleDto,
    qr?: QueryRunner,
  ): Promise<ScheduleModel> {
    const repo = this.getRepository(qr);

    this.logger.log(`create schedule: ${JSON.stringify(scheduleDto)}`);

    try {
      const schedule = repo.create(scheduleDto);
      const scheduleEntity = await repo.save(schedule);

      // Schedule 하위 Task 데이터를 생성
      const tasks = await this.taskService.createTasks(
        schedule,
        scheduleDto.task,
        qr,
      );

      // insert task into schedule
      schedule.tasks = await this.processSchedule(scheduleEntity, tasks);

      return await repo.save(schedule);
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

      await this.jobService.updateCronJob(updatedEntity.id, {
        jobId: updatedEntity.id,
        cronExpression: updatedEntity.interval,
        timeZone: 'Asia/Seoul',
        priority: this.getPriority(updatedEntity.category),
        autoRemove: updatedEntity.removeOnComplete || false,
        startTime:
          updatedEntity.startTime !== undefined
            ? new Date(updatedEntity.startTime)
            : undefined,
        endTime:
          updatedEntity.endTime !== undefined
            ? new Date(updatedEntity.endTime)
            : undefined,
        payload: {
          type: JOB_PAYLOAD.TASK,
          data: updatedEntity.tasks,
        },
      });

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

      const result = await this.jobService.deleteCronJob(entity.id);
      if (!result) {
        throw Error(`failed to remove the job`);
      }

      await this.scheduleRepository.remove(entity);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
      throw error;
    }
  }

  async appendTask(id: string, taskDto: CreateTaskDto, qr: QueryRunner) {
    const repo = this.getRepository(qr);

    this.logger.log(`append task to schedule (id: ${id})`);

    try {
      const schedule = await this.scheduleRepository.findOne({
        where: {
          id: id,
        },
        relations: ['tasks'],
      });

      if (!schedule) {
        throw new NotFoundException('not found schedule corresponding id');
      }

      const appendedTasks = await this.taskService.createTasks(
        schedule,
        [taskDto],
        qr,
      );

      schedule.tasks.push(...appendedTasks);

      await repo.save(schedule);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
      throw error;
    }
  }

  async deleteTask(taskId: string) {
    this.logger.log(`delete task to schedule (taskId: ${taskId})`);

    try {
      await this.taskService.deleteTask(taskId);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
      throw error;
    }
  }

  async updateTask(taskId: string, taskDto: UpdateTaskDto) {
    this.logger.log(
      `update task (taskId: ${taskId}, taskDto: ${JSON.stringify(taskDto)})`,
    );

    try {
      await this.taskService.deleteTask(taskId);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processSchedule(
    schedule: ScheduleModel,
    tasks: TaskModel[],
  ): Promise<TaskModel[]> {
    // 각 task에 해당하는 job 생성
    if (schedule.category === ScheduleCategory.task) {
      // task 동작은 매 주기마다
      // 현재 subtask의 상태에 따라 TTS 음성 메시지가 바뀔 수 있음
      await this.jobService.createCronJob({
        jobId: schedule.id,
        cronExpression: schedule.interval,
        timeZone: 'Asia/Seoul',
        priority: this.getPriority(schedule.category),
        autoRemove: schedule.removeOnComplete || false,
        startTime:
          schedule.startTime !== undefined && schedule.startTime !== null
            ? new Date(schedule.startTime)
            : undefined,
        endTime:
          schedule.endTime !== undefined && schedule.endTime !== null
            ? new Date(schedule.endTime)
            : undefined,
        payload: {
          type: JOB_PAYLOAD.SCHEDULE,
          data: schedule,
        },
      });
    } else {
      for (const task of tasks) {
        // 음성 생성
        await this.jobService.createTTSJob({
          jobId: task.id,
          text: task.text,
        });

        // 디바이스에 명령 전송
        await this.jobService.createCronJob({
          jobId: schedule.id,
          cronExpression: schedule.interval,
          timeZone: 'Asia/Seoul',
          priority: this.getPriority(schedule.category),
          autoRemove: schedule.removeOnComplete || false,
          startTime:
            schedule.startTime !== undefined
              ? new Date(schedule.startTime)
              : undefined,
          endTime:
            schedule.endTime !== undefined
              ? new Date(schedule.endTime)
              : undefined,
          payload: {
            type: JOB_PAYLOAD.TASK,
            data: task,
          },
        });
      }
    }

    return tasks;
  }
}
