import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskModel } from './entites/task.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { DataSource, Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { ScheduleCategory } from 'src/schedule/enum/schedule.enum';
import { TaskStatus } from './enum/task.enum';
import { ScheduleModel } from 'src/schedule/entities/schedule.entity';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService implements OnModuleInit {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TaskModel)
    private readonly taskRepository: Repository<TaskModel>,
    @InjectQueue('cronQueue') private readonly cronQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('drain all jobs in queue');
    await this.cronQueue.drain();
  }

  private async createCronJob(
    category: ScheduleCategory,
    cronExpression: string,
    task: TaskModel,
  ) {
    // 스케줄 카테고리에 따른 우선순위 설정
    //  * 정각 알림 > 이벤트 > 루틴
    let priority = 0;
    if (category === ScheduleCategory.onTime) {
      priority = 0;
    } else if (category === ScheduleCategory.event) {
      priority = 1;
    } else if (category === ScheduleCategory.routine) {
      priority = 2;
    } else {
      priority = 0;
    }

    const serviceName = 'vtlr-service';
    const featureName = 'task';
    const uniqueId = new Date().getTime();
    const cronJobName = `${serviceName}:${featureName}:${uniqueId}`;

    return await this.cronQueue.add(
      cronJobName,
      {
        task,
      },
      {
        priority: priority || 0,
        repeat: { pattern: cronExpression, tz: 'Asia/Seoul' },
      },
    );
  }

  async findByScheduleId(id: string): Promise<TaskModel[]> {
    return this.taskRepository.find({
      where: { scheduleId: id },
    });
  }

  async createTask(
    parentSchedule: ScheduleModel,
    taskDtos: CreateTaskDto[],
  ): Promise<TaskModel[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let cronJobIds = [];

    try {
      return await Promise.all(
        taskDtos.map(async (taskDto) => {
          const entity = queryRunner.manager.create(TaskModel, {
            title: 'title for task',
            description: 'description for task',
            text: taskDto.text,
            volume: taskDto.volume,
            language: taskDto.language,
            status: TaskStatus.pending,
            attemps: 0,
            result: {},
          });
          entity.scheduleId = parentSchedule.rowId;

          await queryRunner.manager.save(TaskModel, entity);

          queryRunner.commitTransaction();

          // 각 Task에 맞는 cron-job을 생성한다
          const cronJob = await this.createCronJob(
            parentSchedule.category,
            parentSchedule.interval,
            entity,
          );
          cronJobIds.push(cronJob.id);

          return entity;
        }),
      );
    } catch (error) {
      this.logger.error(`Error occurred creating task (err: ${error})`);

      await queryRunner.rollbackTransaction();

      cronJobIds.forEach((item) => {
        this.cronQueue.remove(item);
      });

      throw new InternalServerErrorException('Error occurred saving task');
    } finally {
      await queryRunner.release();
    }
  }

  async updateTask(id: string, taskDto: UpdateTaskDto): Promise<TaskModel> {
    try {
      const entity = await this.taskRepository.findOne({
        where: {
          rowId: id,
        },
      });

      if (!entity) {
        throw new NotFoundException(
          `not found task corresponding id (id: ${id})`,
        );
      }
      return this.taskRepository.merge(entity, taskDto);
    } catch (error) {
      this.logger.error(`Error occurred update task (err: ${error})`);
      throw error;
    }
  }
}
