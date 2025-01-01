import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('task')
@UseInterceptors(ClassSerializerInterceptor)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  async getAllTasks() {
    return this.taskService.findTasks();
  }

  @Get('/:taskId')
  async getOneTask(@Param('taskId') taskId: string) {
    return this.taskService.findTaskById(taskId);
  }

  @Delete('/:taskId')
  async deleteTask(@Param('taskId') taskId: string) {
    return this.taskService.deleteTask(taskId);
  }

  @Patch('/:taskId')
  async patchTask(
    @Param('taskId') taskId: string,
    @Body() updateTask: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(taskId, updateTask);
  }
}
