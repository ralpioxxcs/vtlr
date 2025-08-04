import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Logger,
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

@Controller('schedule')
@UseInterceptors(ClassSerializerInterceptor)
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  async getAllSchedules(
    @Query('date') date?: string,
    @Query('schduleTypes') scheduleTypes?: string[],
  ) {
    return this.scheduleService.findAllSchedules(date, scheduleTypes);
  }

  @Post()
  @UseInterceptors(TxInterceptor)
  async createSchedule(
    @Body() createSchedule: CreateScheduleDto,
    @QueryRunner() qr: QR,
  ) {
    this.logger.debug('createSchedule()');
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
    @Body() updateSchedule: UpdateScheduleDto & { command?: string },
  ) {
    return this.scheduleService.updateSchedule(scheduleId, updateSchedule);
  }
}
