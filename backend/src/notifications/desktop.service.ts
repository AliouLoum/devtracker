import { Injectable, Logger } from '@nestjs/common';
import * as notifier from 'node-notifier';
import * as path from 'path';

@Injectable()
export class DesktopNotificationService {
  private readonly logger = new Logger(DesktopNotificationService.name);

  notify(title: string, message: string, projectColor?: string) {
    try {
      this.logger.log(`Desktop Notification: [${title}] ${message}`);
      notifier.notify({
        title,
        message,
        icon: path.join(__dirname, '../../assets/icon.png'),
        sound: true,
        wait: false,
        appID: 'DevTracker', // Windows-only identifier
      });
    } catch (error: any) {
      this.logger.error(`Failed to send desktop notification: ${error.message}`);
    }
  }

  taskReminder(taskTitle: string, projectName: string) {
    this.notify(
      `⏰ Rappel — ${projectName}`,
      taskTitle
    );
  }

  dailyBriefing(todayCount: number, overdueCount: number) {
    this.notify(
      '☀️ DevTracker — Briefing du jour',
      `${todayCount} tâches aujourd'hui · ${overdueCount} en retard`
    );
  }

  taskOverdue(taskTitle: string, projectName: string) {
    this.notify(
      `🔴 Tâche en retard — ${projectName}`,
      taskTitle
    );
  }

  milestoneReached(projectName: string, percent: number) {
    this.notify(
      `🎯 Milestone atteint !`,
      `${projectName} est à ${percent}% — continue comme ça !`
    );
  }

  weeklyReview(completed: number, pending: number) {
    this.notify(
      '📊 Revue hebdomadaire',
      `${completed} tâches complétées cette semaine · ${pending} en attente`
    );
  }
}
