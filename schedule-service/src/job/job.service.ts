import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { JOB_QUEUE_NAME, TTS_QUEUE_NAME } from 'src/common/const/queue.constg';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectQueue(JOB_QUEUE_NAME) private readonly cronQueue: Queue,
    @InjectQueue(TTS_QUEUE_NAME) private readonly ttsQueue: Queue,
  ) {}

  async createJob(
    cronExpr: string,
    jobId: string,
    payload?: any,
    priority?: number,
    autoRemove?: boolean,
    startTime?: Date,
    endTime?: Date,
  ): Promise<Job> {
    const ttsJobName = `tts_job_${new Date().getTime()}`;

    const ttsJobResult = await this.ttsQueue.add(ttsJobName, {
      id: payload.id,
      voice: 'model',
      text: payload.text,
    });
    this.logger.log(`tts job added (${ttsJobResult.id}) successfully`);

    //---------------------------------------------------------------------
    const jobName = `vtlr-service_${new Date().getTime()}`;

    // BullMQ에 task의 payload를 담은 repeatable job을 생성한다
    const result = await this.cronQueue.upsertJobScheduler(
      jobId,
      {
        startDate: startTime !== undefined ? startTime.getTime() : undefined,
        endDate: endTime !== undefined ? endTime.getTime() : undefined,
        pattern: cronExpr,
        tz: 'Asia/Seoul',
        count: autoRemove ? 1 : 0,
      },
      {
        name: jobName,
        data: payload,
        opts: {
          attempts: 0,
          priority: priority || 0,
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    );

    this.logger.log(`create the job successfully (name: ${jobName})`);

    return result;
  }

  async updateJob(jobId: string, payload: object): Promise<Job> {
    const result = await this.cronQueue.upsertJobScheduler(
      jobId,
      {},
      {
        data: payload,
      },
    );

    this.logger.log(`update the job successfully (id: ${jobId})`);

    return result;
  }

  async deleteJob(jobId: string): Promise<boolean> {
    const result = await this.cronQueue.removeJobScheduler(jobId);

    //this.cronQueue.drain();

    this.logger.log(
      `delete the job ${result ? 'successfully' : 'failed'} (id: ${jobId}) --> ${result}`,
    );

    return result;
  }
}
