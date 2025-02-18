import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import {
  ENV_REDIS_HOST_KEY,
  ENV_REDIS_PORT_KEY,
} from 'src/common/const/env-keys.const';
import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JOB_QUEUE_NAME, TTS_QUEUE_NAME } from 'src/common/const/queue.const';

@Module({
  imports: [
    HttpModule,
    BullModule.forRoot({
      connection: {
        host: process.env[ENV_REDIS_HOST_KEY],
        port: Number(process.env[ENV_REDIS_PORT_KEY] || 6379),
      },
    }),
    BullModule.registerQueue(
      {
        name: JOB_QUEUE_NAME,
      },
      { name: TTS_QUEUE_NAME },
    ),
  ],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
