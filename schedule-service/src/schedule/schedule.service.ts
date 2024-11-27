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
import { CreateScheduleDto } from './dto/schedule.dto';

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
    console.dir(scheduleDto);

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

    return newSchedule;

    // const cronExp = this.isoToCron(schedule.date);
    //
    // console.dir(cronExp);
    //
    // const cronJobName = 'cronjob';
    //
    // const postData = {
    //   command: 'voice',
    //   parameters: {
    //     text: schedule.name,
    //     language: 'ko',
    //     volume: 0.6,
    //   },
    // };
    //
    // const scheduledJob = new CronJob(
    //   cronExp,
    //   async () => {
    //     // call API
    //     const resp = await lastValueFrom(
    //       this.httpService
    //         .post<any>(
    //           'http://127.0.0.1:8000/devices/123123/commands',
    //           postData,
    //         )
    //         .pipe(
    //           catchError((error: AxiosError) => {
    //             throw error;
    //           }),
    //         ),
    //     );
    //
    //     console.dir(resp);
    //
    //     this.schedulerRegistry.deleteCronJob(cronJobName);
    //   },
    //   () => {
    //     console.log('completed');
    //   },
    //   false,
    //   'UTC',
    // );
    //
    // this.schedulerRegistry.addCronJob(cronJobName, scheduledJob);
    // scheduledJob.start();
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

    const minute = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const dayOfWeek = '*';

    const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    return cronExpression;
  }
}
