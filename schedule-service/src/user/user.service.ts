import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entities/user.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UserDevicesModel } from './entities/user-devices.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    @InjectRepository(UserDevicesModel)
    private readonly usersDeviceRepository: Repository<UserDevicesModel>,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<UserModel>(UserModel)
      : this.userRepository;
  }

  async getUserByRole(role: string) {
    try {
      const row = await this.userRepository.findOne({
        where: {
          role,
        },
      });
      return row;
    } catch (error) {
      this.logger.error(`Error occurred finding user (err: ${error})`);
      throw error;
    }
  }

  async findAllDeviceIdsByUserId(userId: string): Promise<string[]> {
    try {
      const rows = await this.usersDeviceRepository.find({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

      return rows.map((item) => item.id);
    } catch (error) {
      this.logger.error(`Error occurred finding user (err: ${error})`);
      throw error;
    }
  }
}
