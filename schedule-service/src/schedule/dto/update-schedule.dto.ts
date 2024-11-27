import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './schedule.dto';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
