import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CronJob } from 'cron';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { TaskModel } from 'src/task/entites/task.entity';
import { TaskStatus } from 'src/task/enum/task.enum';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
    @InjectRepository(TaskModel)
    private readonly taskRepository: Repository<TaskModel>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ScheduleModel>(ScheduleModel)
      : this.scheduleRepository;
  }

  async findAllSchedules() {
    this.logger.debug('find all schedules');
    try {
      return this.scheduleRepository.find({
        relations: ['tasks'],
      });
    } catch (error) {
      this.logger.error(`Error occurred finding schedule (err: ${error})`);
    }
  }

  async findScheduleById(id: string) {
    try {
      return this.scheduleRepository.findOne({
        where: {
          rowId: id,
        },
        relations: ['tasks'],
      });
    } catch (error) {
      this.logger.error(`Error occurred finding schedule (err: ${error})`);
    }
  }

  async createSchedule(scheduleDto: CreateScheduleDto) {
    // Create a schedule
    const schedule = this.scheduleRepository.create({
      ...scheduleDto,
    });
    const newSchedule = await this.scheduleRepository.save(schedule);

    // Create a new tasks according to schedule
    const task = this.createNewTask(newSchedule.rowId, scheduleDto.param);
    const newTask = await this.taskRepository.save(task);

    // Create a Job
    const cronJobName = `schedule_${Date().toString()}`;
    const job = new CronJob(
      scheduleDto.interval,
      async () => {
        // Get task information
        const task = await this.taskRepository.find({
          where: {
            rowId: newTask.rowId,
          },
        });

        // Invoke tasks
        task.forEach(async (item) => {
          const result = await this.invokeLambdaFunction({
            text: item.payload.text,
            volume: item.payload.volume / 100,
          });
          this.logger.log(`lambda result: ${result}`);

          // Update each task
          item.status = TaskStatus.completed;
          item.attemps += 1;
          item.result = result;

          await this.taskRepository.save(item);
        });
      },
      'Asia/Seoul',
    );

    this.schedulerRegistry.addCronJob(cronJobName, job);
    job.start();

    return newSchedule;
  }

  async updateSchedule(id: string, scheduleDto: UpdateScheduleDto) {
    const { title, description, type, interval } = scheduleDto;

    const schedule = await this.scheduleRepository.findOne({
      where: {
        rowId: id,
      },
    });

    if (!schedule) {
      throw new NotFoundException();
    }

    if (title) {
      scheduleDto.title = title;
    }
    if (description) {
      scheduleDto.description = description;
    }
    if (type) {
      scheduleDto.type = type;
    }
    if (interval) {
      scheduleDto.interval = interval;
    }

    const newSchedule = await this.scheduleRepository.save(schedule);

    return newSchedule;
  }

  async deleteAllSchedule() {
    try {
      return await this.scheduleRepository.clear();
    } catch (error) {
      this.logger.error(`Error occurred on deleting rows (err: ${error})`);
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
        throw new NotFoundException('not found schedule');
      }

      return await this.scheduleRepository.remove(schedule);
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule (err: ${error})`);
    }
  }

  private createNewTask(scheduleId: string, param: any) {
    try {
      const newTask = this.taskRepository.create({
        status: TaskStatus.pending,
        attemps: 0,
        payload: param,
        result: {},
      });
      newTask.scheduleId = scheduleId;
      return newTask;
    } catch (error) {
      this.logger.error(
        `Error occurred saving task according schedule (err: ${error})`,
      );
      throw new InternalServerErrorException('Error occurred saving task');
    }
  }

  // private isoToCron(isoDate: string): string {
  //   const date = new Date(isoDate);
  //
  //   if (isNaN(date.getTime())) {
  //     throw new Error('Invalid ISO date string');
  //   }
  //
  //   const seconds = date.getUTCSeconds();
  //   const minute = date.getUTCMinutes();
  //   const hour = date.getUTCHours();
  //   const dayOfMonth = date.getUTCDate();
  //   const month = date.getUTCMonth() + 1;
  //   const dayOfWeek = '*';
  //
  //   const cronExpression = `${seconds} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  //   return cronExpression;
  // }

  private async invokeLambdaFunction(data: any) {
    const lambdaClient = new LambdaClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      endpoint: 'http://127.0.0.1:4566',
    });
    const invokeParams = {
      FunctionName: 'MyLambdaFunction',
      Payload: JSON.stringify({
        data: {
          text: data.text,
          volume: data.volume,
        },
      }),
    };

    const { Payload, LogResult } = await lambdaClient.send(
      new InvokeCommand(invokeParams),
    );

    const result = Buffer.from(Payload).toString();

    return result;
  }
}
