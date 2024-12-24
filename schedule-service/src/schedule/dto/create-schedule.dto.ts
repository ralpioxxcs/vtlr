import { PickType } from '@nestjs/mapped-types';
import { ScheduleModel } from '../entities/schedule.entity';
import { ScheduleType } from '../enum/schedule.enum';
import {
    IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsCronExpression } from 'src/common/decorators/is-cron.decorator';

export class CreateScheduleDto extends PickType(ScheduleModel, [
  'title',
  'description',
  'type',
  'category',
  'interval',
  'active'
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

  @IsString()
  @IsOptional()
  category: string;

  @IsString()
  @IsNotEmpty()
  @IsCronExpression({ message: 'invalid cron expression' })
  interval: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @IsObject()
  @IsNotEmpty()
  param: any;
}
