import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TimeEntry } from '../tasks/entities/time-entry.entity';

@Injectable()
export class WeeklyReportService {
  private readonly logger = new Logger(WeeklyReportService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(TimeEntry) private timeEntryRepository: Repository<TimeEntry>,
  ) {
    // Configure MailHog for local dev
    this.transporter = nodemailer.createTransport({
      host: 'mailhog',
      port: 1025,
      ignoreTLS: true,
    });
  }

  // Runs every Monday at 00:00
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReports() {
    this.logger.log('Generating weekly PDF reports...');
    const users = await this.userRepository.find();
    
    for (const user of users) {
      // Typically we'd check if user has weekly report enabled in their settings
      // We assume yes for this demo
      try {
        await this.generateAndSendReport(user);
      } catch (error) {
        this.logger.error(`Failed to generate report for ${user.email}`, error);
      }
    }
  }

  async generateAndSendReport(user: User) {
    // Get past week's boundaries
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // Get completed tasks
    const completedTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.user_id = :userId', { userId: user.id })
      .andWhere('task.status = :status', { status: TaskStatus.DONE })
      .andWhere('task.updated_at >= :oneWeekAgo', { oneWeekAgo })
      .getMany();

    // Get total time spent (using the time_entries or just summing the task timeSpentSeconds)
    // To be precise to the week, we query time_entries
    const timeEntries = await this.timeEntryRepository
      .createQueryBuilder('entry')
      .where('entry.user_id = :userId', { userId: user.id })
      .andWhere('entry.start_time >= :oneWeekAgo', { oneWeekAgo })
      .andWhere('entry.end_time IS NOT NULL')
      .getMany();

    const totalSeconds = timeEntries.reduce((acc, entry) => {
      const diff = entry.endTime!.getTime() - entry.startTime.getTime();
      return acc + Math.round(diff / 1000);
    }, 0);
    
    const totalHours = (totalSeconds / 3600).toFixed(1);

    const templateData = {
      userName: user.email.split('@')[0], // Simplified name
      weekDate: oneWeekAgo.toLocaleDateString(),
      completedTasksCount: completedTasks.length,
      totalHours,
      tasks: completedTasks.map(t => ({
        title: t.title,
        projectName: t.project?.name || 'Inbox',
        timeSpent: `${(t.timeSpentSeconds / 3600).toFixed(1)}h`
      }))
    };

    // Load template
    const templatePath = path.join(__dirname, 'templates', 'weekly-report.hbs');
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateHtml);
    const html = template(templateData);

    // Generate PDF with Puppeteer
    // NOTE: In Docker, you often need --no-sandbox
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Usually required in alpine containers
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Send Email
    await this.transporter.sendMail({
      from: '"DevTracker Reports" <reports@devtracker.local>',
      to: user.email,
      subject: `Your Weekly Productivity Report - ${now.toLocaleDateString()}`,
      text: 'Please find your weekly report attached.',
      attachments: [
        {
          filename: `weekly-report-${now.toISOString().split('T')[0]}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        }
      ]
    });

    this.logger.log(`Sent weekly report to ${user.email}`);
  }
}
