import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { JOB_QUEUE_NAME, TTS_QUEUE_NAME } from 'src/common/const/queue.constg';

export type JobPayload = {
  type: string;
  data: object;
};

export type TTSJob = {
  jobId: string;
  voice: string;
  text: string;
};

export type CronJob = {
  jobId: string;
  cronExpression: string;
  timeZone: string;
  priority?: number;
  autoRemove?: boolean;
  startTime?: Date;
  endTime?: Date;
  prevMinutes?: number;
  payload: JobPayload;
};

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectQueue(JOB_QUEUE_NAME) private readonly cronQueue: Queue,
    @InjectQueue(TTS_QUEUE_NAME) private readonly ttsQueue: Queue,
  ) {}

  async createCronJob(job: CronJob): Promise<Job> {
    this.logger.debug(`creating cron job (jobId: ${job.jobId})`);

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
        prevMillis: job.prevMinutes ? job.prevMinutes * 60000 : 0,
      },
      {
        name: jobName,
        opts: {
          attempts: 0,
          priority: job.priority || 0,
          removeOnComplete: true,
          removeOnFail: true,
        },
        data: job.payload,
      },
    );

    this.logger.debug(`create the job successfully (jobId: ${job.jobId})`);

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
    this.logger.debug(`create tts job (jobId: ${job.jobId})`);

    const ttsJobName = `tts_job_${new Date().getTime()}`;
    const ttsJobResult = await this.ttsQueue.add(ttsJobName, {
      id: job.jobId,
      voice: job.voice,
      text: job.text,
    });
    this.logger.debug(`tts job added successfully (jobId: ${job.jobId})`);
  }
}
