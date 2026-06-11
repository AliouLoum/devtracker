import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AnalyticsService } from './analytics.service';
import { SettingsService } from './settings.service';
import { UserSettings } from './entities/user-settings.entity';
import { Task, TaskPriority, TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class IntelligenceCron {
  private readonly logger = new Logger(IntelligenceCron.name);

  constructor(
    private readonly analytics: AnalyticsService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsGateway,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
  ) {}

  @Cron('0 * * * * *')
  async handleBriefingsAndReviews(): Promise<void> {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().slice(0, 10);
    const dayOfWeek = now.getDay();

    const briefings = await this.settings.findAllEnabledBriefings();
    for (const s of briefings) {
      const time = (s.dailyBriefingTime ?? '08:00:00').slice(0, 5);
      if (time === hhmm && s.lastDailyBriefingDate !== today) {
        const data = await this.analytics.getDailyBriefingData(s.userId);
        this.notifications.sendEvent(s.userId, 'daily-briefing', data);
        await this.settingsRepo.update(s.userId, {
          lastDailyBriefingDate: today,
        });
        this.logger.log(`Daily briefing sent to ${s.userId}`);
      }
    }

    const reviews = await this.settings.findAllEnabledWeeklyReviews();
    for (const s of reviews) {
      const time = (s.weeklyReviewTime ?? '19:00:00').slice(0, 5);
      if (
        dayOfWeek === (s.weeklyReviewDay ?? 0) &&
        time === hhmm &&
        s.lastWeeklyReviewDate !== today
      ) {
        const data = await this.analytics.getWeeklyReviewData(s.userId);
        this.notifications.sendEvent(s.userId, 'weekly-review', data);
        await this.settingsRepo.update(s.userId, {
          lastWeeklyReviewDate: today,
        });
        this.logger.log(`Weekly review sent to ${s.userId}`);
      }
    }
  }

  @Cron('0 2 * * *') // Every day at 2:00 AM
  async autoPrioritizeTasks(): Promise<void> {
    this.logger.log('Running auto-prioritization algorithm...');
    
    const activeTasks = await this.tasksRepo.find({
      where: [
        { status: TaskStatus.TODO },
        { status: TaskStatus.DOING }
      ]
    });

    const today = new Date().getTime();
    let updatedCount = 0;

    for (const task of activeTasks) {
      if (!task.dueDate) continue;
      
      const daysLeft = (new Date(task.dueDate).getTime() - today) / 86400000;
      let newPriority = task.priority;

      if (daysLeft <= 1) {
        newPriority = TaskPriority.HIGH;
      } else if (daysLeft <= 3) {
        newPriority = TaskPriority.MEDIUM;
      }

      if (newPriority !== task.priority) {
        task.priority = newPriority;
        await this.tasksRepo.save(task);
        updatedCount++;
      }
    }

    this.logger.log(`Auto-prioritization complete. Updated ${updatedCount} tasks.`);
  }
}
