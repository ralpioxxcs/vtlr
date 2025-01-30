import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from './entities/user.entity';
import { UserDevicesModel } from './entities/user-devices.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserModel, UserDevicesModel])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
