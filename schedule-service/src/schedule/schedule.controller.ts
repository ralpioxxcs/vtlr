import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { TxInterceptor } from 'src/common/interceptors/tx.interceptor';
import { QueryRunner as QR } from 'typeorm';
import { QueryRunner } from 'src/common/decorators/query-runner.decorator';
import { CreateTaskDto } from 'src/task/dto/task.dto';

@Controller('schedule')
@UseInterceptors(ClassSerializerInterceptor)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  async getAllSchedules(
    @Query('type') type: string,
    @Query('category') category: string,
  ) {
    return this.scheduleService.findAllSchedules(type, category);
  }

  @Post()
  @UseInterceptors(TxInterceptor)
  async createSchedule(
    @Body() createSchedule: CreateScheduleDto,
    @QueryRunner() qr: QR,
  ) {
    return this.scheduleService.createSchedule(createSchedule, qr);
  }

  @Get('/:scheduleId')
  async getOneSchedule(@Param('scheduleId') scheduleId: string) {
    return this.scheduleService.findScheduleById(scheduleId);
  }

  @Delete('/:scheduleId')
  async deleteSchedule(@Param('scheduleId') scheduleId: string) {
    return this.scheduleService.deleteSchedule(scheduleId);
  }

  @Patch('/:scheduleId')
  async patchSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() updateSchedule: UpdateScheduleDto,
  ) {
    return this.scheduleService.updateSchedule(scheduleId, updateSchedule);
  }

  @Post('/:scheduleId/task')
  @UseInterceptors(TxInterceptor)
  async addTask(
    @Param('scheduleId') scheduleId: string,
    @Body() createTask: CreateTaskDto,
    @QueryRunner() qr: QR,
  ) {
    return this.scheduleService.appendTask(scheduleId, createTask, qr);
  }

  @Delete('/task/:taskId')
  @UseInterceptors(TxInterceptor)
  async deleteTask(@Param('taskId') taskId: string, @QueryRunner() qr: QR) {
    return this.scheduleService.deleteTask(taskId, qr);
  }

  // @Patch('/:scheduleId/task/:taskId')
  // @UseInterceptors(TxInterceptor)
  // async patchTask(
  //   @Param('scheduleId') scheduleId: string,
  //   @Param('taskId') taskId: string,
  //   @Body() createTask: CreateTaskDto,
  //   @QueryRunner() qr: QR,
  // ) {
  //   //return this.scheduleService.appendTask(scheduleId, createTask, qr);
  // }
}
