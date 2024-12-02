import { PickType } from '@nestjs/mapped-types';
import { TaskModel } from '../entites/task.entity';
import { IsNotEmpty, IsObject } from 'class-validator';

export class CreateTaskDto extends PickType(TaskModel, ['payload']) {
  @IsNotEmpty()
  @IsObject()
  payload: any;
}
