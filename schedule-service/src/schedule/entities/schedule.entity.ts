import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

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
    type: 'jsonb',
  })
  schedule_config: object;

  @Column({
    type: 'jsonb',
  })
  action_config: object;

  @Column({
    type: 'boolean',
  })
  active: boolean;
}
