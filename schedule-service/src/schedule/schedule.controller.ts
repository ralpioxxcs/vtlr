import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/schedule.dto';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  async getAllSchedules() {
    return this.scheduleService.findAllSchedules();
  }

  @Post()
  async createSchedule(@Body() createSchedule: CreateScheduleDto) {
    return this.scheduleService.createSchedule(createSchedule);
  }

  @Get('/:scheduleId')
  async getOneSchedule(@Param() scheduleId: string) {
    return this.scheduleService.findScheduleById(scheduleId);
  }

  @Delete('/:scheduleId')
  async deleteSchedule(@Param() scheduleId: string) {
    return this.scheduleService.deleteSchedule(scheduleId);
  }

  @Patch('/:scheduleId')
  async patchSchedule(
    @Param() scheduleId: string,
    @Body() updateSchedule: UpdateScheduleDto,
  ) {
    return this.scheduleService.updateSchedule(scheduleId, updateSchedule);
  }
}
