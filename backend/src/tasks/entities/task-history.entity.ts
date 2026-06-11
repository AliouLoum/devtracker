import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task, TaskStatus } from './task.entity';

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ name: 'old_status', type: 'varchar', length: 10, nullable: true })
  oldStatus!: TaskStatus | null;

  @Column({ name: 'new_status', type: 'varchar', length: 10 })
  newStatus!: TaskStatus;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;
}
