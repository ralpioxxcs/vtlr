import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  schema: 'vtlr',
  name: 'user_devices',
})
export class UserDevicesModel extends BaseModel {
  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
  })
  userId: string;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 64,
    nullable: false,
  })
  deviceName: string;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 45,
    nullable: false,
  })
  ipAddress: string;

  @Column({
    name: 'mac_address',
    type: 'varchar',
    length: 17,
    nullable: true,
  })
  macAddress: string;

  @Column({
    name: 'manufacturer',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  manufacture: string;

  @Column({
    name: 'model',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  model: string;

  @Column({
    name: 'volume',
    type: 'integer',
    nullable: false,
    default: 50
  })
  volume: number;
}
