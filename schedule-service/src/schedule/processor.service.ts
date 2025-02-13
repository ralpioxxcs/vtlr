import { HttpService } from '@nestjs/axios';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { JOB_QUEUE_NAME, TTS_QUEUE_NAME } from 'src/common/const/queue.constg';
import { TaskModel } from 'src/task/entites/task.entity';
import { UserService } from 'src/user/user.service';
import { ScheduleModel } from './entities/schedule.entity';
import { Repository } from 'typeorm';
import { ScheduleType } from './enum/schedule.enum';

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
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
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
    this.logger.log(`job ${job.id} - cron pattern: ${job.opts.repeat.pattern}`);
    this.logger.log(
      `job ${job.id} - reported progress: ${JSON.stringify(progress)}`,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`job started (name: ${job.name})`);
    await this.handleTask(job.data);
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

    const deviceIds = await this.userService.findAllDeviceIdsByUserId(
      task.userId,
    );

    if (deviceIds.length <= 0) {
      this.logger.error(`${task.userId} has no devices`);
      return;
    }
    this.logger.log(`${task.userId} has ${deviceIds.length} has devices`);

    const URL = `${process.env.CHROMECAST_SERVICE_HOST}/v1.0/chromecast/device/play`;
    const payload: DeviceRequestPayload = {
      playId: task.id,
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
