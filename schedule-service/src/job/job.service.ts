import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { JOB_QUEUE_NAME, TTS_QUEUE_NAME } from 'src/common/const/queue.constg';

export type TTSJob = {
  jobId: string;
  voice: string;
  text: string;
};

export type CronJob<T> = {
  jobId: string;
  cronExpression: string;
  timeZone: string;
  priority?: number;
  autoRemove?: boolean;
  startTime?: Date;
  endTime?: Date;
  payload: T;
};

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectQueue(JOB_QUEUE_NAME) private readonly cronQueue: Queue,
    @InjectQueue(TTS_QUEUE_NAME) private readonly ttsQueue: Queue,
  ) {}

  async createCronJob<T>(job: CronJob<T>): Promise<Job> {
    const jobName = `vtlr-service_${new Date().getTime()}`;

    // BullMQ에 task의 payload를 담은 repeatable job을 생성한다
    const result = await this.cronQueue.upsertJobScheduler(
      job.jobId,
      {
        startDate:
          job.startTime !== undefined ? job.startTime.getTime() : undefined,
        endDate: job.endTime !== undefined ? job.endTime.getTime() : undefined,
        pattern: job.cronExpression,
        tz: job.timeZone || 'Asia/Seoul',
        count: job.autoRemove ? 1 : 0,
      },
      {
        name: jobName,
        data: job.payload,
        opts: {
          attempts: 0,
          priority: job.priority || 0,
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    );

    this.logger.log(`create the job successfully (name: ${jobName})`);

    return result;
  }

  async updateCronJob(jobId: string, data: any): Promise<Job> {
    const result = await this.cronQueue.upsertJobScheduler(
      jobId,
      {},
      {
        data,
      },
    );

    this.logger.log(`update the job successfully (id: ${jobId})`);

    return result;
  }

  async deleteCronJob(jobId: string): Promise<boolean> {
    const result = await this.cronQueue.removeJobScheduler(jobId);

    //this.cronQueue.drain();

    this.logger.log(
      `delete the job ${result ? 'successfully' : 'failed'} (id: ${jobId}) --> ${result}`,
    );

    return result;
  }

  async createTTSJob(job: TTSJob) {
    const ttsJobName = `tts_job_${new Date().getTime()}`;
    const ttsJobResult = await this.ttsQueue.add(ttsJobName, {
      id: job.jobId,
      voice: job.voice,
      text: job.text,
    });
    this.logger.log(`tts job added (${ttsJobResult.id}) successfully`);
  }
}
