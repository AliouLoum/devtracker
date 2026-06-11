import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'daily_briefing_time', type: 'time', default: '08:00:00' })
  dailyBriefingTime!: string;

  @Column({ name: 'daily_briefing_enabled', default: true })
  dailyBriefingEnabled!: boolean;

  @Column({ name: 'weekly_review_enabled', default: true })
  weeklyReviewEnabled!: boolean;

  @Column({ name: 'weekly_review_day', default: 0 })
  weeklyReviewDay!: number;

  @Column({ name: 'weekly_review_time', type: 'time', default: '19:00:00' })
  weeklyReviewTime!: string;

  @Column({ default: 'Europe/Paris' })
  timezone!: string;

  @Column({ name: 'last_daily_briefing_date', type: 'date', nullable: true })
  lastDailyBriefingDate!: string | null;

  @Column({ name: 'last_weekly_review_date', type: 'date', nullable: true })
  lastWeeklyReviewDate!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  preferences!: Record<string, any> | null;

  @Column({ name: 'google_tokens', type: 'jsonb', nullable: true })
  googleTokens!: Record<string, any> | null;

  @Column({ name: 'github_token', type: 'varchar', length: 255, nullable: true })
  githubToken!: string | null;

  @Column({ name: 'github_username', type: 'varchar', length: 255, nullable: true })
  githubUsername!: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
