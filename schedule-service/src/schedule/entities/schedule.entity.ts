import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { ScheduleType } from '../enum/schedule.enum';

@Entity({
  name: 'schedule',
})
export class ScheduleModel extends BaseModel {
  @Column()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string | null;

  @Column()
  @IsEnum(ScheduleType)
  @IsNotEmpty()
  type: ScheduleType;

  @Column({
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  executionDate: Date | null;

  @Column({
    nullable: true,
  })
  @IsString()
  @IsOptional()
  interval: string | null;
}
