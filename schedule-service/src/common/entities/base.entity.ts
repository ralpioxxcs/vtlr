import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseModel {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
  })
  id: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
