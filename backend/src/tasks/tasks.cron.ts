import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { TasksService } from './tasks.service';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class TasksCron {
  private readonly logger = new Logger(TasksCron.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Cron('*/30 * * * * *')
  async handleReminders(): Promise<void> {
    const tasks = await this.tasksService.findDueReminders();
    for (const task of tasks) {
      const project = task.project as Project;
      const userId = project.userId;
      this.notificationsGateway.sendReminder(userId, {
        taskId: task.id,
        taskTitle: task.title,
        projectName: project.name,
      });
      await this.tasksService.markReminderSent(task.id);
      this.logger.log(`Reminder sent for task ${task.id}`);
    }
  }
}
