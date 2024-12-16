import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Controller('schedule')
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
  async createSchedule(@Body() createSchedule: CreateScheduleDto) {
    return this.scheduleService.createSchedule(createSchedule);
  }

  @Delete()
  async deleteAllSchedule() {
    return this.scheduleService.deleteAllSchedule();
  }

  @Get('/:scheduleId')
  async getOneSchedule(
    @Param('scheduleId') scheduleId: string,
  ) {
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
}
