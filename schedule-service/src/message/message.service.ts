import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(@InjectQueue('schedule-queue') private scheduleQueue: Queue) {}

  async addScheduleToQueue(schedule: any) {
    this.logger.log(`Adding schedule to queue: ${JSON.stringify(schedule)}`);

    const { id, schedule_config } = schedule;
    const options = { jobId: id, removeOnComplete: true, removeOnFail: true };

    if (schedule_config.type === 'ONE_TIME') {
      const delay = new Date(schedule_config.datetime).getTime() - Date.now();
      if (delay > 0) {
        this.logger.log(
          `Scheduling ONE_TIME job ${id} with delay of ${delay}ms`,
        );
        await this.scheduleQueue.add('schedule', schedule, {
          ...options,
          delay,
        });
      } else {
        this.logger.warn(
          `Job ${id} is in the past, adding to queue for immediate execution.`,
        );
        await this.scheduleQueue.add('schedule', schedule, options);
      }
    } else if (schedule_config.type === 'RECURRING') {
      const cron = this.convertToCron(
        schedule_config.time,
        schedule_config.days,
      );
      this.logger.log(`Scheduling RECURRING job ${id} with cron: ${cron}`);
      await this.scheduleQueue.add('schedule', schedule, {
        ...options,
        repeat: { pattern: cron },
      });
    } else if (schedule_config.type === 'HOURLY') {
      const minute = schedule_config.time.split(':')[1];
      const cron = `${minute} * * * *`;
      this.logger.log(`Scheduling HOURLY job ${id} with cron: ${cron}`);
      await this.scheduleQueue.add('schedule', schedule, {
        ...options,
        repeat: { pattern: cron },
      });
    } else {
      this.logger.log(`Adding job ${id} to queue for immediate execution.`);
      await this.scheduleQueue.add('schedule', schedule, options);
    }
  }

  async removeScheduleFromQueue(scheduleId: string) {
    this.logger.log(`Removing schedule ${scheduleId} from queue`);
    const job = await this.scheduleQueue.getJob(scheduleId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${scheduleId} removed successfully.`);
    }
  }

  private convertToCron(time: string, days: string[]): string {
    const [hour, minute] = time.split(':');
    const dayMap = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6, 일: 0 };
    const dayOfWeek = days.map((day) => dayMap[day]).join(',');
    return `${minute} ${hour} * * ${dayOfWeek}`;
  }
}
