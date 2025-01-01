import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { JOB_QUEUE_NAME } from 'src/common/const/queue.constg';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(@InjectQueue(JOB_QUEUE_NAME) private readonly cronQueue: Queue) {}

  async createJob(
    cronExpr: string,
    jobId: string,
    payload?: object,
    priority?: number,
    //autoRemove?: boolean,
  ): Promise<Job> {
    const jobName = `vtlr-service_${new Date().getTime()}`;

    // BullMQ에 task의 payload를 담은 repeatable job을 생성한다
    const result = await this.cronQueue.upsertJobScheduler(
      jobId,
      {
        pattern: cronExpr,
        tz: 'Asia/Seoul',
      },
      {
        name: jobName,
        data: payload,
        opts: {
          attempts: 0,
          priority: priority || 0,
          //removeOnComplete: autoRemove,
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
