import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { ScheduleType } from '../enum/schedule.enum';

@Entity({
  name: 'schedule',
})
export class ScheduleModel extends BaseModel {
  @Column()
  title: string;

  @Column({
    nullable: true,
  })
  description: string | null;

  @Column()
  type: ScheduleType;

  @Column({
    nullable: true,
  })
  executionDate: Date | null;

  @Column({
    nullable: true,
  })
  interval: string | null;
}
