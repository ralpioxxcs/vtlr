import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleModule as sm } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleModel]),
    HttpModule,
    sm.forRoot(),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
