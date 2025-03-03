import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from './entities/user.entity';
import { UserDevicesModel } from './entities/user-devices.entity';
import { UserTTSModel } from './entities/user-tts.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, UserDevicesModel, UserTTSModel]),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
