import { PickType } from '@nestjs/mapped-types';
import { ScheduleModel } from '../entities/schedule.entity';
import { ScheduleCategory, ScheduleType } from '../enum/schedule.enum';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsCronExpression } from 'src/common/decorators/is-cron.decorator';
import { Type } from 'class-transformer';
import { CreateTaskDto } from 'src/task/dto/task.dto';

export class CreateScheduleDto extends PickType(ScheduleModel, [
  'title',
  'description',
  'type',
  'category',
  'interval',
  'active',
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
  category: ScheduleCategory;

  @IsString()
  @IsNotEmpty()
  @IsCronExpression({ message: 'invalid cron expression' })
  interval: string;

  @IsBoolean()
  @IsNotEmpty()
  active: boolean;

  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  task: CreateTaskDto[];
}
