import { HttpService } from '@nestjs/axios';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { JOB_QUEUE_NAME } from 'src/common/const/queue.constg';
import { TaskModel } from 'src/task/entites/task.entity';
import { TaskStatus } from 'src/task/enum/task.enum';
import { Repository } from 'typeorm';

@Processor(JOB_QUEUE_NAME, {})
export class CronProcessor extends WorkerHost {
  private readonly logger = new Logger(CronProcessor.name);

  constructor(
    @InjectRepository(TaskModel)
    private readonly taskRepository: Repository<TaskModel>,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  @OnWorkerEvent('ready')
  onReady() {
    console.log('Worker is ready to process jobs');
  }

  @OnWorkerEvent('closed')
  onClosed() {
    console.log('Worker has been closed');
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    console.error(`Worker encountered an error: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(`Job ${job.id} has started processing`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job ${job.id} has been completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} has failed with error: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    console.log(`Job ${job.id} reported progress: ${JSON.stringify(progress)}`);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.handleTask(job.data);
  }

  private async handleTask(task: TaskModel) {
    // Getting task information
    // const entities = await this.taskRepository.find({
    //   where: {
    //     rowId: task.rowId,
    //   },
    //   relations: ['schedule'],
    //   order: {
    //     createdAt: 'ASC',
    //   },
    // });

    // Invoke tasks sequentially
    //for (const item of entities) {
    // if (!item.schedule.active) {
    //   this.logger.log(
    //     `schedule is not active, skip to invoke task (id: ${item.schedule.rowId})`,
    //   );
    //   continue;
    // }

    try {
      const response = await this.requestChromecast({
        text: task.text,
        volume: task.volume / 100 || 0.5,
        language: task.language || 'ko',
      });

      this.logger.log(`response: ${JSON.stringify(response)}`);

      // Update each task
      // task.status = TaskStatus.completed;
      // task.attemps += 1;
      // task.result = response;
      //
      // await this.taskRepository.save(task);
      // this.logger.debug(`task updated (${JSON.stringify(task, null, 2)})`);
    } catch (error) {
      this.logger.error(`Error occurred invoking function (err: ${error})`);
      //
      // task.status = TaskStatus.failed;
      // await this.taskRepository.save(task);
      // this.logger.debug(`task updated (${JSON.stringify(task, null, 2)})`);
    }
    //}
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
