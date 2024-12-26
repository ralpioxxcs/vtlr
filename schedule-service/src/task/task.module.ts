import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { HttpModule } from '@nestjs/axios';
import { TaskModel } from './entites/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import {
  ENV_REDIS_HOST_KEY,
  ENV_REDIS_PORT_KEY,
} from 'src/common/const/env-keys.const';
import { CronProcessor } from 'src/schedule/processor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskModel]),
    HttpModule,
    BullModule.forRoot({
      connection: {
        host: process.env[ENV_REDIS_HOST_KEY],
        port: Number(process.env[ENV_REDIS_PORT_KEY] || 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'cronQueue',
    }),
  ],
  providers: [TaskService, CronProcessor],
  exports: [TaskService],
})
export class TaskModule {}
