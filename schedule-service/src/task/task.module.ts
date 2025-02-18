import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { HttpModule } from '@nestjs/axios';
import { TaskModel } from './entites/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronProcessor, TTSProcessor } from 'src/schedule/processor.service';
import { TaskController } from './task.controller';
import { UserModule } from 'src/user/user.module';
import { ScheduleModel } from 'src/schedule/entities/schedule.entity';
import { JobModule } from 'src/job/job.module';
import { TTSModule } from 'src/tts-api/tts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskModel, ScheduleModel]),
    HttpModule,
    UserModule,
    JobModule,
    TTSModule
  ],
  controllers: [TaskController],
  providers: [TaskService, CronProcessor, TTSProcessor],
  exports: [TaskService],
})
export class TaskModule {}
