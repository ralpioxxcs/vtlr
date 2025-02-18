import { HttpService } from '@nestjs/axios';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { JOB_QUEUE_NAME, TTS_QUEUE_NAME } from 'src/common/const/queue.const';
import { TaskModel } from 'src/task/entites/task.entity';
import { UserService } from 'src/user/user.service';
import { ScheduleModel } from './entities/schedule.entity';
import { Repository } from 'typeorm';
import { ScheduleType } from './enum/schedule.enum';
import { TaskStatus } from 'src/task/enum/task.enum';
import { JobPayload, SchedulePayload, TTSJob } from 'src/job/type/job-type';
import { JOB_PAYLOAD } from 'src/job/const/job-type.const';
import { TTSService } from 'src/tts-api/tts.service';

type DeviceRequestPayload = {
  deviceIds: string[];
  playId: string;
};

type TTSRequestPayload = {
  text: string;
  playId: string;
};

@Processor(JOB_QUEUE_NAME, {})
export class CronProcessor extends WorkerHost {
  private readonly logger = new Logger(CronProcessor.name);

  constructor(
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    private readonly ttsService: TTSService,
  ) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    console.log('CronQueue Worker is ready to process jobs');
  }

  @OnWorkerEvent('closed')
  onClosed() {
    console.log('CronQueue Worker has been closed');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    console.error(`CronQueue Worker encountered an error: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Cron job ${job.id} has started processing`);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    console.log(`Cron job ${job.id} has been completed`);

    // 해당 완료된 task가 속한 schedule의 설정에 따라 schedule을 삭제하거나 그대로 둔다
    //  * recurring, on_time: 삭제 X
    //  * one_time: 삭제 O
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: {
          id: job.data.scheduleId,
        },
      });

      if (schedule.type === ScheduleType.oneTime && schedule.removeOnComplete) {
        this.logger.log(`schedule (${schedule.id}) will be deleted`);
        await this.scheduleRepository.remove(schedule);
      }
    } catch (error) {
      this.logger.error(`Error occurred delete schedule (err: ${error})`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} has failed with error: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(`job ${job.id} - cron : ${job.opts.repeat.pattern}`);
    this.logger.log(`job ${job.id} - progress: ${JSON.stringify(progress)}`);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`job started (id: ${job.id})`);

    const payload = job.data as JobPayload;

    if (payload.type === JOB_PAYLOAD.SCHEDULE) {
      await this.handleSchedule(job.data.data);
    } else if (payload.type === JOB_PAYLOAD.TASK) {
      await this.handleTask(job.data.data);
    } else {
      this.logger.error(`unsupported job type`);
    }
  }

  private async handleSchedule(scheduleData: SchedulePayload) {
    this.logger.debug(`handleSchedulePrep()`);

    // 모든 task를 가져온다
    const schedule = await this.scheduleRepository.findOne({
      where: {
        id: scheduleData.id,
      },
      relations: ['tasks'],
    });

    if (!schedule.active) {
      this.logger.log(
        `schedule (${scheduleData.id}) not active, skip the task`,
      );
      return;
    }

    const tasks = schedule.tasks;
    this.logger.debug(`current task: ${JSON.stringify(tasks)}`);

    const ttsJob: TTSJob = {
      jobId: schedule.id,
      text: '',
    };

    if (tasks.every((item) => item.status === TaskStatus.completed)) {
      // 모든 task가 완료된 경우
      this.logger.log(`all task is done (id: ${scheduleData.id})`);
      ttsJob.text = `${schedule.title}에 해당하는 모든 할일이 완료되었습니다. 수고하셨습니다.`;

      schedule.active = false;
      await this.scheduleRepository.save(schedule);
    } else {
      // 모든 task가 완료되지 않은 경우
      ttsJob.text = `${schedule.title}에 해당하는 남은 할일을 알려드립니다.`;
      for (const task of tasks) {
        if (task.status !== TaskStatus.completed) {
          ttsJob.text += `${task.title},`;
        }
      }
      ttsJob.text += `입니다.`;
      if (scheduleData.endTime) {
        const now = new Date().getTime();
        const target = new Date(scheduleData.endTime).getTime();

        let diffInMillis = target - now;

        if (diffInMillis > 0) {
          const hours = Math.floor(diffInMillis / (1000 * 60 * 60));
          const minutes = Math.floor(
            (diffInMillis % (1000 * 60 * 60)) / (1000 * 60),
          );
          const seconds = Math.floor((diffInMillis % (1000 * 60)) / 1000);
          this.logger.debug(
            `hours: ${hours}, minutes: ${minutes}, seconds: ${seconds}`,
          );

          const remainTimeText = hours
            ? hours + '시간'
            : '' + minutes
              ? minutes + '분'
              : '' + seconds
                ? seconds + '초'
                : '';

          ttsJob.text += `종료까지 남은시간은 ${remainTimeText} 입니다.`;
          if (hours <= 0 && minutes < 30) {
            ttsJob.text += `서두르세요!`;
          }
        }
      }
    }

    try {
      const response = await this.ttsService.createTTS({
        playId: ttsJob.jobId,
        text: ttsJob.text,
      });
      this.logger.debug(`create tts: ${JSON.stringify(response)}`);

      // FIXME: 유저정보를 따로 관리
      const user = await this.userService.getUserByRole('admin');

      await this.playToDevice(scheduleData.id, user.id);
    } catch (error) {
      this.logger.error(`error occurred in creating tts`);
    }
  }

  private async handleTask(task: TaskModel) {
    // 현재 task가 속한 schedule entity의 status를 체크
    const schedule = await this.scheduleRepository.findOne({
      where: {
        id: task.scheduleId,
      },
      select: {
        active: true,
      },
    });

    if (!schedule.active) {
      this.logger.log(`schedule (${schedule.id}) not active, skip the task`);
      return;
    }

    await this.playToDevice(task.id, task.userId);
  }

  private async playToDevice(playId: string, userId: string) {
    const deviceIds = await this.userService.findAllDeviceIdsByUserId(userId);

    if (deviceIds.length <= 0) {
      this.logger.error(`${userId} has no devices`);
      return;
    }
    this.logger.log(`${userId} has ${deviceIds.length} has devices`);

    const URL = `${process.env.CHROMECAST_SERVICE_HOST}/v1.0/chromecast/device/play`;
    const payload: DeviceRequestPayload = {
      playId,
      deviceIds: deviceIds,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(URL, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(`Response: ${JSON.stringify(response.data)}`);

      return response.data;
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      throw error;
    }
  }
}

@Processor(TTS_QUEUE_NAME, {})
export class TTSProcessor extends WorkerHost {
  private readonly logger = new Logger(CronProcessor.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    console.log('Worker is ready to process jobs');
  }

  @OnWorkerEvent('closed')
  onClosed() {
    console.log('Worker has been closed');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    console.error(`Worker encountered an error: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Job ${job.id} has started processing`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} has been completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} has failed with error: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.log(
      `job ${job.id} - reported progress: ${JSON.stringify(progress)}`,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.handleTask(job.data);
  }

  private async handleTask(task: TaskModel) {
    const URL = `${process.env.TTS_SERVICE_HOST}/v1.0/tts/speech`;
    const payload: TTSRequestPayload = {
      playId: task.id,
      text: task.text,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(URL, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          data: payload,
        }),
      );
      this.logger.log(`Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error: ${error.message}`);
      throw error;
    }
  }
}
