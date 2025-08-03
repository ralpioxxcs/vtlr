
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MessageService } from './message.service';
import { ScheduleProcessor } from './schedule.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'schedule-queue',
    }),
  ],
  providers: [MessageService, ScheduleProcessor],
  exports: [MessageService],
})
export class MessageModule {}
