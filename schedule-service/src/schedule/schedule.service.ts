import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleType } from './enum/schedule.enum';
import { CronJob } from 'cron';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
    private schedulerRegistry: SchedulerRegistry,
    private httpService: HttpService,
  ) {}

  async findAllSchedules() {
    return this.scheduleRepository.find({});
  }

  async findScheduleById(id: string) {
    return this.scheduleRepository.findOne({
      where: {
        rowId: id,
      },
    });
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ScheduleModel>(ScheduleModel)
      : this.scheduleRepository;
  }

  async createSchedule(scheduleDto: CreateScheduleDto) {
    const { type, executionDate, interval } = scheduleDto;

    if (type === ScheduleType.oneTime) {
      if (interval) {
        throw new ConflictException('not supported schedule type');
      }
      if (!executionDate) {
        throw new BadRequestException('oneTime schedule needs executionDate');
      }
    }
    if (type === ScheduleType.recurring) {
      if (executionDate) {
        throw new ConflictException('not supported schedule type');
      }
      if (!interval) {
        throw new BadRequestException('recurring schedule needs interval');
      }
    }

    const schedule = this.scheduleRepository.create({
      ...scheduleDto,
    });

    const newSchedule = await this.scheduleRepository.save(schedule);

    let cronExpression = '';
    if (scheduleDto.type === ScheduleType.oneTime) {
      cronExpression = this.isoToCron(schedule.executionDate.toString());
    } else if (schedule.type === ScheduleType.recurring) {
      cronExpression = scheduleDto.interval;
    }

    const cronJobName = `schedule_${Date().toString()}`;
    const job = new CronJob(
      cronExpression,
      async () => {
        const result = await this.invokeLambdaFunction({
          text: scheduleDto.param.content,
          volume: 50 / 100,
        });
        console.dir(result);
      },
      'Asia/Seoul',
    );

    this.schedulerRegistry.addCronJob(cronJobName, job);
    job.start();

    return newSchedule;
  }

  async updateSchedule(id: string, scheduleDto: UpdateScheduleDto) {
    const { title, description, type, executionDate, interval } = scheduleDto;

    if (type === ScheduleType.oneTime) {
      if (interval) {
        throw new ConflictException('not supported schedule type');
      }
      if (!executionDate) {
        throw new BadRequestException('oneTime schedule needs executionDate');
      }
    }
    if (type === ScheduleType.recurring) {
      if (executionDate) {
        throw new ConflictException('not supported schedule type');
      }
      if (!interval) {
        throw new BadRequestException('recurring schedule needs interval');
      }
    }

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

  async deleteSchedule(id: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: {
        rowId: id,
      },
    });
    if (!schedule) {
      throw new NotFoundException();
    }

    await this.scheduleRepository.delete(schedule);

    return id;
  }

  private isoToCron(isoDate: string): string {
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid ISO date string');
    }

    const seconds = date.getUTCSeconds();
    const minute = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const dayOfWeek = '*';

    const cronExpression = `${seconds} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    return cronExpression;
  }

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
    //const logs = Buffer.from(LogResult, 'base64').toString();

    return result;
  }
}
