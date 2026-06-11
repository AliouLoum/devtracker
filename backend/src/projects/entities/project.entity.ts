import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

export enum ProjectStatus {
  NOT_STARTED = 'not_started',
  ACTIVE = 'active',
  PAUSED = 'paused',
  DONE = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ length: 7, default: '#185FA5' })
  color!: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ name: 'hours_per_week', type: 'integer', nullable: true })
  hoursPerWeek!: number | null;

  @Column({ name: 'estimated_weeks', type: 'integer', nullable: true })
  estimatedWeeks!: number | null;

  @Column({ name: 'github_repo_owner', type: 'varchar', length: 255, nullable: true })
  githubRepoOwner!: string | null;

  @Column({ name: 'github_repo_name', type: 'varchar', length: 255, nullable: true })
  githubRepoName!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProjectStatus.NOT_STARTED,
  })
  status!: ProjectStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];
}
