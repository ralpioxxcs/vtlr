import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleModule as sm } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { TaskModel } from 'src/task/entites/task.entity';
import { BullModule } from '@nestjs/bullmq';
import { CronProcessor } from './processor.service';
import {
  ENV_REDIS_HOST_KEY,
  ENV_REDIS_PORT_KEY,
} from 'src/common/const/env-keys.const';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleModel, TaskModel]),
    HttpModule,
    sm.forRoot(),
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
  controllers: [ScheduleController],
  providers: [ScheduleService, CronProcessor],
})
export class ScheduleModule {}
