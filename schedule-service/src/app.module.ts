import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from './schedule/schedule.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ENV_DB_DATABASE_KEY,
  ENV_DB_HOST_KEY,
  ENV_DB_PASSWORD_KEY,
  ENV_DB_PORT_KEY,
  ENV_DB_USERNAME_KEY,
} from './common/const/env-keys.const';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModel } from './schedule/entities/schedule.entity';
import { TaskModel } from './task/entites/task.entity';
import { JobModule } from './job/job.module';
import { TaskModule } from './task/task.module';
import { UserModule } from './user/user.module';
import { UserModel } from './user/entities/user.entity';
import { UserDevicesModel } from './user/entities/user-devices.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env[ENV_DB_HOST_KEY],
      port: parseInt(process.env[ENV_DB_PORT_KEY]),
      username: process.env[ENV_DB_USERNAME_KEY],
      password: process.env[ENV_DB_PASSWORD_KEY],
      database: process.env[ENV_DB_DATABASE_KEY],
      entities: [ScheduleModel, TaskModel, UserModel, UserDevicesModel],
      //synchronize: true,
    }),
    ScheduleModule,
    TaskModule,
    JobModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
