import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  schema: 'vtlr',
  name: 'users',
})
export class UserModel extends BaseModel {
  @Column({
    name: 'username',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  username: string;

  @Column({
    name: 'password',
    type: 'text',
    nullable: false,
  })
  password: string;

  @Column({
    name: 'role',
    type: 'text',
    nullable: false,
  })
  role: string;
}
