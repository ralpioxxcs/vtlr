import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { TaskModule } from 'src/task/task.module';
import { JobModule } from 'src/job/job.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleModel]),
    HttpModule,
    TaskModule,
    JobModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
