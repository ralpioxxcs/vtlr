import { Exclude } from 'class-transformer';
import { BaseModel } from 'src/common/entities/base.entity';
import { ScheduleModel } from 'src/schedule/entities/schedule.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({
  schema: 'vtlr',
  name: 'task',
})
export class TaskModel extends BaseModel {
  @Column({
    type: 'varchar',
    length: 64,
  })
  title: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 16,
  })
  status: string;

  @Column({
    type: 'text',
  })
  text: string;

  @Column({
    type: 'integer',
  })
  volume: number;

  @Column({
    type: 'varchar',
    length: 16,
  })
  language: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  result: object | null;

  @Column({
    type: 'integer',
  })
  attemps: number;

  @ManyToOne(() => ScheduleModel, (schedule) => schedule.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule: ScheduleModel;

  @Exclude()
  @Column({
    name: "schedule_id"
  })
  scheduleId: string;
}
