import { PickType } from '@nestjs/mapped-types';
import { ScheduleModel } from '../entities/schedule.entity';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateScheduleDto extends PickType(ScheduleModel, [
  'title',
  'description',
  'active',
]) {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsObject()
  @IsNotEmpty()
  schedule_config: object;

  @IsObject()
  @IsNotEmpty()
  action_config: object;
}
