import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskModel } from './entites/task.entity';
import { QueryRunner, Repository } from 'typeorm';
import { TaskStatus } from './enum/task.enum';
import { ScheduleModel } from 'src/schedule/entities/schedule.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(TaskModel)
    private readonly taskRepository: Repository<TaskModel>,
    private readonly userService: UserService,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<TaskModel>(TaskModel)
      : this.taskRepository;
  }

  async findTasks(): Promise<TaskModel[]> {
    return this.taskRepository.find();
  }

  async findTaskById(id: string): Promise<TaskModel[]> {
    return this.taskRepository.find({
      where: { id },
    });
  }

  async createTasks(
    parentSchedule: ScheduleModel,
    taskDtos: CreateTaskDto[],
    qr?: QueryRunner,
  ): Promise<TaskModel[]> {
    const repo = this.getRepository(qr);

    // FIXME: 유저정보를 따로 관리
    const user = await this.userService.getUserByRole('admin');

    return await Promise.all(
      taskDtos.map(async (taskDto) => {
        const entity = repo.create({
          userId: user.id,
          title: taskDto.title || 'title',
          description: taskDto.description || 'description',
          text: taskDto.text,
          language: taskDto.language,
          status: TaskStatus.pending,
          attemps: 0,
          result: {},
        });
        entity.scheduleId = parentSchedule.id;

        await repo.save(entity);

        return entity;
      }),
    );
  }

  async updateTask(id: string, taskDto: UpdateTaskDto): Promise<TaskModel> {
    try {
      const entity = await this.taskRepository.findOne({
        where: {
          id,
        },
      });

      if (!entity) {
        throw new NotFoundException(
          `not found task corresponding id (id: ${id})`,
        );
      }
      const updatedEntity = this.taskRepository.merge(entity, taskDto);
      await this.taskRepository.save(updatedEntity);

      return updatedEntity;
    } catch (error) {
      this.logger.error(`Error occurred update task (err: ${error})`);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const entity = await this.taskRepository.findOne({
        where: {
          id,
        },
      });

      if (!entity) {
        throw new NotFoundException(
          `not found task corresponding id (id: ${id})`,
        );
      }
      await this.taskRepository.remove(entity);
    } catch (error) {
      this.logger.error(`Error occurred update task (err: ${error})`);
      throw error;
    }
  }
}
