import { HttpService } from '@nestjs/axios';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { TaskModel } from 'src/task/entites/task.entity';
import { TaskStatus } from 'src/task/enum/task.enum';
import { Repository } from 'typeorm';

@Processor('cronQueue', {})
export class CronProcessor extends WorkerHost {
  private readonly logger = new Logger(CronProcessor.name);

  constructor(
    @InjectRepository(TaskModel)
    private readonly taskRepository: Repository<TaskModel>,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { task } = job.data;

    this.logger.log(`job execute!`);

    await this.handleTask(task);
  }

  private async handleTask(task: TaskModel) {
    // Getting task information
    const entities = await this.taskRepository.find({
      where: {
        rowId: task.rowId,
      },
      relations: ['schedule'],
      order: {
        createdAt: 'ASC',
      },
    });

    // Invoke tasks sequentially
    for (const item of entities) {
      if (!item.schedule.active) {
        this.logger.log(
          `schedule is not active, skip to invoke task (id: ${item.schedule.rowId})`,
        );
        continue;
      }

      try {
        const response = await this.requestChromecast({
          text: item.payload.text,
          volume: item.payload.volume / 100 || 0.5,
          language: item.payload.language || 'ko',
        });
        this.logger.log(`response: ${response}`);

        // Update each task
        item.status = TaskStatus.completed;
        item.attemps += 1;
        item.result = response;

        await this.taskRepository.save(item);
        this.logger.debug(`task updated (${JSON.stringify(item, null, 2)})`);
      } catch (error) {
        this.logger.error(`Error occurred invoking function (err: ${error})`);

        item.status = TaskStatus.failed;
        await this.taskRepository.save(item);
        this.logger.debug(`task updated (${JSON.stringify(item, null, 2)})`);
      }
    }
  }

  private async requestChromecast(data: any) {
    const deviceId = 123123;
    const URL = `http://${process.env.CHROMECAST_SERVICE_HOST}/v1.0/chromecast/device/${deviceId}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(URL, data, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log('Response:', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('Error:', error.message);
      throw error;
    }
  }
}
