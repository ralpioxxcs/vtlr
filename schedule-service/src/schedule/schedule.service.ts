import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CronJob } from 'cron';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { TaskModel } from 'src/task/entites/task.entity';
import { TaskStatus } from 'src/task/enum/task.enum';
import * as cronParser from 'cron-parser';
import { ScheduleType } from './enum/schedule.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScheduleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
    @InjectRepository(TaskModel)
    private readonly taskRepository: Repository<TaskModel>,
    private schedulerRegistry: SchedulerRegistry,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    @InjectQueue('cronQueue') private readonly cronQueue: Queue,
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

      // configure schedules only meet below conditions
      //  * schedule type is "recurring"
      //  * schedule type is "one_time" but, not started
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
        this.logger.debug(`schedule: ${entity.title}`);

        await this.registerSchedule(entity, entity.tasks[0]);
        await this.delay(100);
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
    this.logger.debug('cleanup');
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ScheduleModel>(ScheduleModel)
      : this.scheduleRepository;
  }

  async registerSchedule(schedule: ScheduleModel, param: any) {
    // Create a new tasks according to schedule
    const newTask = await this.createNewTask(schedule, param);

    let priority = 0;
    if (schedule.category === 'on_time') {
      priority = 0;
    } else if (schedule.category === 'event') {
      priority = 1;
    } else if (schedule.category === 'routine') {
      priority = 2;
    }

    return await this.createJob(schedule.interval, newTask, priority);
  }

  async findAllSchedules(type?: string, category?: string) {
    this.logger.debug('find all schedules');
    try {
      const rows = await this.scheduleRepository.find({
        where: {
          type: type as ScheduleType,
          category,
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

  private async createJob(cronExp: string, task: TaskModel, priority?: number) {
    const serviceName = 'vtlr-service';
    const featureName = 'job';
    const uniqueId = new Date().getTime();
    const cronJobName = `${serviceName}:${featureName}:${uniqueId}`;

    const job = await this.cronQueue.add(
      cronJobName,
      {
        task,
      },
      {
        priority: priority || 0,
        repeat: { pattern: cronExp, tz: 'Asia/Seoul' },
      },
    );
    this.logger.log(`job created: ${JSON.stringify(job.toJSON(), null, 2)}`);
    //this.logger.log(`new job started (jobId: ${cronJobName})`);
  }

  async createSchedule(scheduleDto: CreateScheduleDto) {
    // if (
    //   scheduleDto.type === ScheduleType.oneTime &&
    //   this.isCronExpired(scheduleDto.interval)
    // ) {
    //   throw new BadRequestException(
    //     'interval should has future date when one_time type of schedule',
    //   );
    // }

    // Create a schedule
    const schedule = this.scheduleRepository.create({
      ...scheduleDto,
    });
    const newSchedule = await this.scheduleRepository.save(schedule);

    const newJob = await this.registerSchedule(newSchedule, scheduleDto.param);

    return { newSchedule, newJob };
  }

  async updateSchedule(id: string, scheduleDto: UpdateScheduleDto) {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: {
          rowId: id,
        },
      });

      const task = await this.taskRepository.findOne({
        where: {
          schedule: {
            rowId: id,
          },
        },
        relations: ['schedule'],
      });

      if (!schedule) {
        throw new NotFoundException('not found schedule corresponding id');
      }
      if (!task) {
        throw new NotFoundException('not found tasks corresponding id');
      }

      const mergedSchedule = this.scheduleRepository.merge(
        schedule,
        scheduleDto,
      );
      const updated = await this.scheduleRepository.save(mergedSchedule);

      const mergedTask = this.taskRepository.merge(task, {
        payload: scheduleDto.param,
      });
      await this.taskRepository.save(mergedTask);

      return updated;
    } catch (error) {
      this.logger.error(`Error occurred update schedule (err: ${error})`);
      throw error;
    }
  }

  async deleteAllSchedule() {
    try {
      return await this.scheduleRepository.clear();
    } catch (error) {
      this.logger.error(`Error occurred on deleting rows (err: ${error})`);
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

  private async createNewTask(schedule: ScheduleModel, param: any) {
    try {
      const newTask = this.taskRepository.create({
        status: TaskStatus.pending,
        attemps: 0,
        payload: param,
        result: {},
      });
      newTask.schedule = schedule;

      const entity = await this.taskRepository.save(newTask);

      return entity;
    } catch (error) {
      this.logger.error(
        `Error occurred saving task according schedule (err: ${error})`,
      );
      throw new InternalServerErrorException('Error occurred saving task');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
