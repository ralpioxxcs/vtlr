import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseModel {
  @PrimaryGeneratedColumn('uuid', {
    name: 'row_id',
  })
  rowId: string;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
