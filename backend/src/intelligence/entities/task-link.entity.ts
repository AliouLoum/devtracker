import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';

@Entity('task_links')
@Unique(['sourceTaskId', 'targetTaskId'])
export class TaskLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_task_id' })
  sourceTask!: Task;

  @Column({ name: 'source_task_id', type: 'uuid' })
  sourceTaskId!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_task_id' })
  targetTask!: Task;

  @Column({ name: 'target_task_id', type: 'uuid' })
  targetTaskId!: string;
}
