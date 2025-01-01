import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { HttpModule } from '@nestjs/axios';
import { TaskModel } from './entites/task.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronProcessor } from 'src/schedule/processor.service';
import { TaskController } from './task.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskModel]), HttpModule],
  controllers: [TaskController],
  providers: [TaskService, CronProcessor],
  exports: [TaskService],
})
export class TaskModule {}
