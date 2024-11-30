import { PickType } from '@nestjs/mapped-types';
import { ScheduleModel } from '../entities/schedule.entity';
import { ScheduleType } from '../enum/schedule.enum';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateScheduleDto extends PickType(ScheduleModel, [
  'title',
  'description',
  'type',
  'executionDate',
  'interval',
]) {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(ScheduleType)
  @IsNotEmpty()
  type: ScheduleType;

  @IsDateString()
  @IsOptional()
  executionDate: Date;

  @IsString()
  @IsOptional()
  interval: string;

  param: {
    content: string;
  };
}
