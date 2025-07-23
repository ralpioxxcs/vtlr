import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './task.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../enum/task.enum';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: string
}
