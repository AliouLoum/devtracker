import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface TemplateTaskItem {
  title: string;
  notes?: string;
  dueDateOffsetDays?: number;
  priority?: 'high' | 'medium' | 'low';
  status?: 'todo' | 'doing' | 'done';
  estimatedMinutes?: number;
}

@Entity('task_templates')
export class TaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'tasks_json', type: 'jsonb', default: [] })
  tasksJson!: TemplateTaskItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
