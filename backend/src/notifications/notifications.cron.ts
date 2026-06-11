import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, Not } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { UserSettings } from '../intelligence/entities/user-settings.entity';
import { DesktopNotificationService } from './desktop.service';
import { EmailNotificationService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    private readonly desktopService: DesktopNotificationService,
    private readonly emailService: EmailNotificationService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * 1. Check reminders every 30 seconds
   */
  @Cron('*/30 * * * * *')
  async checkReminders() {
    this.logger.debug('Running Cron job: checkReminders...');
    const now = new Date();
    
    // Find tasks that have an active reminder due and not yet sent
    const tasks = await this.tasksRepo.find({
      where: {
        reminderAt: LessThan(now),
        reminderSent: false,
      },
      relations: ['project'],
    });

    if (tasks.length === 0) return;

    this.logger.log(`Found ${tasks.length} pending reminders.`);

    for (const task of tasks) {
      const userId = task.userId || task.project?.userId;
      if (!userId) continue;

      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (!user) continue;

      // Get user settings
      let settings = await this.settingsRepo.findOne({ where: { userId } });
      const preferences = settings?.preferences as any || {};
      const desktopPref = preferences.desktop || { enabled: true, reminders: true };
      const emailPref = preferences.email || { enabled: true, reminders: true };

      const projectName = task.project?.name || 'Inbox';

      // 1. Send WebSocket notification to live app
      this.gateway.sendReminder(userId, {
        taskId: task.id,
        taskTitle: task.title,
        projectName,
      });

      // 2. Send OS Desktop Notification
      if (desktopPref.enabled && desktopPref.reminders) {
        this.desktopService.taskReminder(task.title, projectName);
      }

      // 3. Send Email Notification
      if (emailPref.enabled && emailPref.reminders) {
        const targetEmail = user.email === 'aliouloum2004@gmail.com' ? 'aliouloum@esp.sn' : user.email;
        await this.emailService.sendTaskReminder(
          targetEmail,
          user.name,
          task.title,
          projectName,
          task.dueDate || 'Aujourd\'hui',
          task.notes || '',
        );
      }

      // Mark reminder as sent
      task.reminderSent = true;
      await this.tasksRepo.save(task);
    }
  }

  /**
   * 2. Check Daily Briefing hourly
   */
  @Cron('0 * * * *')
  async checkDailyBriefing() {
    this.logger.log('Running Cron job: checkDailyBriefing...');
    const now = new Date();
    const currentHourStr = now.toTimeString().slice(0, 5); // e.g. "08:00"
    const todayDateStr = now.toISOString().slice(0, 10); // e.g. "2026-05-24"

    // Fetch all user settings
    const allSettings = await this.settingsRepo.find();

    for (const settings of allSettings) {
      const preferences = settings.preferences as any || {};
      const emailPref = preferences.email || { enabled: true, dailyBriefingTime: '08:00', dailyBriefing: true };
      const desktopPref = preferences.desktop || { enabled: true, dailyBriefing: true };

      // Parse times and dates
      const targetTime = emailPref.dailyBriefingTime || '08:00';
      const targetHour = targetTime.slice(0, 2);

      // If matches the hour and not already sent today
      if (now.getHours() === parseInt(targetHour, 10) && settings.lastDailyBriefingDate !== todayDateStr) {
        const userId = settings.userId;
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) continue;

        // Load tasks due today
        const todayTasks = await this.tasksRepo
          .createQueryBuilder('task')
          .leftJoinAndSelect('task.project', 'project')
          .where('(project.userId = :userId OR task.userId = :userId)', { userId })
          .andWhere('task.dueDate = :todayDateStr', { todayDateStr })
          .getMany();

        // Load overdue tasks
        const overdueTasks = await this.tasksRepo
          .createQueryBuilder('task')
          .leftJoinAndSelect('task.project', 'project')
          .where('(project.userId = :userId OR task.userId = :userId)', { userId })
          .andWhere('task.dueDate < :todayDateStr', { todayDateStr })
          .andWhere('task.status != :done', { done: TaskStatus.DONE })
          .getMany();

        // Format tasks list for email helper
        const formattedToday = todayTasks.map(t => ({
          title: t.title,
          projectName: t.project?.name || 'Inbox',
          projectColor: t.project?.color || '#718096',
          priority: t.priority,
        }));

        const formattedOverdue = overdueTasks.map(t => ({
          title: t.title,
          projectName: t.project?.name || 'Inbox',
          projectColor: t.project?.color || '#718096',
          dueDate: t.dueDate,
        }));

        // Send Desktop Notification
        if (desktopPref.enabled && desktopPref.dailyBriefing) {
          this.desktopService.dailyBriefing(todayTasks.length, overdueTasks.length);
        }

        // Send Email Briefing
        if (emailPref.enabled && emailPref.dailyBriefing) {
          await this.emailService.sendDailyBriefing(
            user.email,
            user.name,
            formattedToday,
            formattedOverdue,
          );
        }

        // Save last sent date
        settings.lastDailyBriefingDate = todayDateStr;
        await this.settingsRepo.save(settings);
      }
    }
  }

  /**
   * 3. Weekly Review Sunday at 19:00
   */
  @Cron('0 19 * * 0')
  async sendWeeklyReview() {
    this.logger.log('Running Cron job: sendWeeklyReview...');
    const now = new Date();
    const todayDateStr = now.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allSettings = await this.settingsRepo.find();

    for (const settings of allSettings) {
      const preferences = settings.preferences as any || {};
      const emailPref = preferences.email || { enabled: true, milestones: true };
      const desktopPref = preferences.desktop || { enabled: true, milestones: true };

      if (settings.lastWeeklyReviewDate !== todayDateStr) {
        const userId = settings.userId;
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user) continue;

        // Fetch completed tasks in past 7 days
        const completedTasks = await this.tasksRepo
          .createQueryBuilder('task')
          .leftJoinAndSelect('task.project', 'project')
          .where('(project.userId = :userId OR task.userId = :userId)', { userId })
          .andWhere('task.status = :done', { done: TaskStatus.DONE })
          .andWhere('task.updatedAt BETWEEN :start AND :end', { start: sevenDaysAgo, end: now })
          .getMany();

        // Fetch project completions progress
        const projects = await this.projectsRepo.find({ where: { userId } });
        const projectProgressList: Array<{ name: string; progress: number }> = [];

        for (const project of projects) {
          const tasks = await this.tasksRepo.find({ where: { projectId: project.id } });
          const total = tasks.length;
          const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
          const progress = total === 0 ? 0 : Math.round((done / total) * 100);
          projectProgressList.push({ name: project.name, progress });
        }

        // Fetch tasks pending next week (due in next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const pendingTasks = await this.tasksRepo
          .createQueryBuilder('task')
          .leftJoinAndSelect('task.project', 'project')
          .where('(project.userId = :userId OR task.userId = :userId)', { userId })
          .andWhere('task.status != :done', { done: TaskStatus.DONE })
          .andWhere('task.dueDate BETWEEN :start AND :end', { start: todayDateStr, end: nextWeek.toISOString().slice(0, 10) })
          .getMany();

        const formattedCompleted = completedTasks.map(t => ({
          title: t.title,
          projectName: t.project?.name || 'Inbox',
        }));

        const formattedPending = pendingTasks.map(t => ({
          title: t.title,
          projectName: t.project?.name || 'Inbox',
        }));

        // Send Desktop Notification
        if (desktopPref.enabled) {
          this.desktopService.weeklyReview(completedTasks.length, pendingTasks.length);
        }

        // Send Email Report
        if (emailPref.enabled) {
          await this.emailService.sendWeeklyReport(
            user.email,
            user.name,
            formattedCompleted,
            projectProgressList,
            formattedPending,
          );
        }

        settings.lastWeeklyReviewDate = todayDateStr;
        await this.settingsRepo.save(settings);
      }
    }
  }

  /**
   * 4. Check overdue tasks hourly
   */
  @Cron('0 * * * *')
  async checkOverdueTasks() {
    this.logger.log('Running Cron job: checkOverdueTasks...');
    const todayDateStr = new Date().toISOString().slice(0, 10);

    const overdueTasks = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.dueDate < :todayDateStr', { todayDateStr })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .andWhere('task.reminderSent = false') // we reuse reminderSent or notify once
      .getMany();

    for (const task of overdueTasks) {
      const userId = task.userId || task.project?.userId;
      if (!userId) continue;

      let settings = await this.settingsRepo.findOne({ where: { userId } });
      const preferences = settings?.preferences as any || {};
      const desktopPref = preferences.desktop || { enabled: true, overdueAlerts: true };

      if (desktopPref.enabled && desktopPref.overdueAlerts) {
        this.desktopService.taskOverdue(task.title, task.project?.name || 'Inbox');
      }
    }
  }

  /**
   * 5. Verify Milestones (called upon task state mutations)
   */
  async checkMilestones(projectId: string) {
    if (!projectId) return;

    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) return;

    const userId = project.userId;
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const tasks = await this.tasksRepo.find({ where: { projectId } });
    const total = tasks.length;
    if (total === 0) return;

    const doneCount = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const percent = Math.round((doneCount / total) * 100);

    // Milestones caps to check
    const milestoneCaps = [25, 50, 75, 100];
    if (!milestoneCaps.includes(percent)) {
      return; // only trigger on exactly reaching these milestone levels
    }

    this.logger.log(`Project "${project.name}" reached milestone: ${percent}%`);

    let settings = await this.settingsRepo.findOne({ where: { userId } });
    const preferences = settings?.preferences as any || {};
    const desktopPref = preferences.desktop || { enabled: true, milestones: true };
    const emailPref = preferences.email || { enabled: true, milestones: true };

    // Send Desktop
    if (desktopPref.enabled && desktopPref.milestones) {
      this.desktopService.milestoneReached(project.name, percent);
    }

    // Send Email
    if (emailPref.enabled && emailPref.milestones) {
      // Find remaining active tasks (up to 3)
      const remainingTasks = tasks
        .filter((t) => t.status !== TaskStatus.DONE)
        .slice(0, 3)
        .map((t) => t.title);

      await this.emailService.sendMilestoneReached(
        user.email,
        user.name,
        project.name,
        percent,
        remainingTasks,
      );
    }
  }
}
