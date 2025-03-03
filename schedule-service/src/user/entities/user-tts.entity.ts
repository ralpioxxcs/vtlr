import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  schema: 'vtlr',
  name: 'user_tts',
})
export class UserTTSModel extends BaseModel {
  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
  })
  userId: string;

  @Column({
    name: 'model_name',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  modelName: string;

  @Column({
    name: 'pitch',
    type: 'int4',
    nullable: true,
  })
  pitch: number;

  @Column({
    name: 'bass',
    type: 'int4',
    nullable: true,
  })
  bass: number;

  @Column({
    name: 'treble',
    type: 'int4',
    nullable: true,
  })
  treble: number;

  @Column({
    name: 'reverb',
    type: 'int4',
    nullable: true,
  })
  reverb: number;
}
