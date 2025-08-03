import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Processor('schedule-queue')
export class ScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduleProcessor.name);
  private readonly redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  });

  async process(job: Job<any>) {
    this.logger.log(`Processing job: ${job.id}`);
    const schedule = job.data;

    const taskId = uuidv4();
    const taskName =
      schedule.action === 'delete'
        ? 'worker.delete_schedule'
        : 'worker.execute_schedule';

    const task = {
      id: taskId,
      task: taskName,
      args: [schedule],
      kwargs: {},
      retries: 0,
      eta: null,
      expires: null,
      utc: true,
      callbacks: null,
      errbacks: null,
      chain: null,
      chord: null,
    };

    const body = Buffer.from(JSON.stringify(task)).toString('base64');

    const message = {
      body,
      'content-encoding': 'base64',
      'content-type': 'application/json',
      headers: {},
      properties: {
        body_encoding: 'base64',
        correlation_id: taskId,
        delivery_info: {
          exchange: '',
          routing_key: 'celery',
        },
        delivery_mode: 2,
        delivery_tag: uuidv4(),
        priority: 0,
        reply_to: uuidv4(),
      },
    };

    await this.redisClient.lpush('celery', JSON.stringify(message));
    this.logger.log(`Pushed job ${job.id} to Celery queue with taskId ${taskId}`);
  }
}
