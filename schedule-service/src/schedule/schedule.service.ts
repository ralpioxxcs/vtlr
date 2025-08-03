import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleModel } from './entities/schedule.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { MessageService } from '../message/message.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(ScheduleModel)
    private readonly scheduleRepository: Repository<ScheduleModel>,
    private readonly messageService: MessageService,
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ScheduleModel>(ScheduleModel)
      : this.scheduleRepository;
  }

  async findAllSchedules() {
    try {
      return await this.scheduleRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      this.logger.error(`Error occurred finding schedules: ${error}`);
      throw error;
    }
  }

  async findScheduleById(id: string) {
    try {
      const schedule = await this.scheduleRepository.findOne({ where: { id } });
      if (!schedule) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }
      return schedule;
    } catch (error) {
      this.logger.error(`Error occurred finding schedule by ID: ${error}`);
      throw error;
    }
  }

  async createSchedule(
    scheduleDto: CreateScheduleDto,
    qr?: QueryRunner,
  ): Promise<ScheduleModel> {
    const repo = this.getRepository(qr);
    this.logger.log(`Creating schedule: ${JSON.stringify(scheduleDto)}`);

    try {
      const schedule = repo.create({
        ...scheduleDto,
      });
      const newSchedule = await repo.save(schedule);
      await this.messageService.addScheduleToQueue(newSchedule);
      return newSchedule;
    } catch (error) {
      this.logger.error(`Error occurred creating schedule: ${error}`);
      throw error;
    }
  }

  async updateSchedule(
    id: string,
    scheduleDto: UpdateScheduleDto,
  ): Promise<ScheduleModel> {
    this.logger.log(`Updating schedule with ID: ${id}`);

    try {
      // First, remove the old job from the queue
      await this.messageService.removeScheduleFromQueue(id);

      const schedule = await this.findScheduleById(id);
      const updatedSchedule = this.scheduleRepository.merge(
        schedule,
        scheduleDto,
      );
      const newSchedule = await this.scheduleRepository.save(updatedSchedule);

      // Then, add the new job to the queue if it's still active
      if (newSchedule.active) {
        await this.messageService.addScheduleToQueue(newSchedule);
      }

      return newSchedule;
    } catch (error) {
      this.logger.error(`Error occurred updating schedule: ${error}`);
      throw error;
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    this.logger.log(`Deleting schedule with ID: ${id}`);
    try {
      await this.messageService.removeScheduleFromQueue(id);
      const result = await this.scheduleRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }
    } catch (error) {
      this.logger.error(`Error occurred deleting schedule: ${error}`);
      throw error;
    }
  }
}
