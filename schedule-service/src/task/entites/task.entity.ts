import { Schedule } from 'aws-sdk/clients/pinpoint';
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
    length: 16,
  })
  status: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  payload: any;

  @Column({
    type: 'json',
    nullable: true,
  })
  result: any;

  @Column({
    type: 'integer',
  })
  attemps: number;

  @ManyToOne(() => ScheduleModel, (schedule) => schedule.tasks, {
    onDelete: 'CASCADE',
  })
  schedule: ScheduleModel;
}
