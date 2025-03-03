import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ScheduleCategory, ScheduleType } from '../enum/schedule.enum';
import { TaskModel } from 'src/task/entites/task.entity';

@Entity({
  schema: 'vtlr',
  name: 'schedules',
})
export class ScheduleModel extends BaseModel {
  @Column({
    type: 'varchar',
    length: 64,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 32,
  })
  type: ScheduleType;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  category: ScheduleCategory | null;

  @Column({
    type: 'varchar',
    length: 64,
  })
  interval: string;

  @Column({
    type: 'boolean',
  })
  active: boolean;

  @Column({
    name: 'remove_on_complete',
    type: 'boolean',
  })
  removeOnComplete: boolean;

  @Column({
    name: 'start_time',
    type: 'timestamp with time zone',
  })
  startTime: Date;

  @Column({
    name: 'end_time',
    type: 'timestamp with time zone',
  })
  endTime: Date;

  @OneToMany(() => TaskModel, (task) => task.schedule, { cascade: true })
  tasks: TaskModel[];
}
