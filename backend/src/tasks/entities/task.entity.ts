import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskStatus {
  TODO = 'todo',
  DOING = 'doing',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User | null;

  @Column({ name: 'is_inbox', default: false })
  isInbox!: boolean;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt!: Date | null;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    type: 'varchar',
    length: 10,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({ name: 'reminder_at', type: 'timestamp', nullable: true })
  reminderAt!: Date | null;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent!: boolean;

  @Column({ name: 'estimated_minutes', type: 'int', default: 30 })
  estimatedMinutes!: number;

  @Column({ name: 'time_spent_seconds', type: 'int', default: 0 })
  timeSpentSeconds!: number;

  @Column({ name: 'issue_number', type: 'int', nullable: true })
  issueNumber!: number | null;

  @Column({ name: 'github_commit_url', type: 'varchar', length: 255, nullable: true })
  githubCommitUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // --- Sub-tasks ---
  @Column({ name: 'parent_task_id', type: 'uuid', nullable: true })
  parentTaskId!: string | null;

  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask!: Task | null;

  @OneToMany(() => Task, (task) => task.parentTask)
  subtasks!: Task[];

  // --- Recurrence ---
  @Column({ type: 'jsonb', nullable: true })
  recurrence!: any | null;

  @Column({ name: 'recurrence_parent_id', type: 'uuid', nullable: true })
  recurrenceParentId!: string | null;

  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recurrence_parent_id' })
  recurrenceParent!: Task | null;

  @Column({ name: 'recurrence_date', type: 'date', nullable: true })
  recurrenceDate!: string | null;

  // --- Dependencies ---
  @Column({ name: 'depends_on_ids', type: 'jsonb', nullable: true, default: [] })
  dependsOnIds!: string[];
}
