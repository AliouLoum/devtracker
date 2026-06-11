import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task, TaskPriority, TaskStatus } from '../tasks/entities/task.entity';
import { MailService } from './mail.service';

@Injectable()
export class DailyReportCron {
  private readonly logger = new Logger(DailyReportCron.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly mailService: MailService,
  ) {}

  // Executes at 09:00 and 20:00 every day
  @Cron('0 9,20 * * *')
  async handleDailyReport() {
    this.logger.log('Starting daily report generation...');
    
    // We send to aliouloum@esp.sn but fetch data for aliouloum2004@gmail.com (or the first user found if it fails)
    const targetEmail = 'aliouloum@esp.sn';
    const dbEmail = 'aliouloum2004@gmail.com'; // User's actual account in DB

    const user = await this.userRepository.findOne({ where: { email: dbEmail } });
    
    if (!user) {
      this.logger.warn(`Target user ${dbEmail} not found in DB. Skipping daily report.`);
      return;
    }

    // Fetch only high priority ongoing tasks
    const highPriorityTasks = await this.taskRepository.find({
      where: [
        { userId: user.id, status: TaskStatus.TODO, priority: TaskPriority.HIGH },
        { userId: user.id, status: TaskStatus.DOING, priority: TaskPriority.HIGH }
      ]
    });

    if (highPriorityTasks.length === 0) {
      this.logger.log(`No high priority tasks found for ${targetEmail}. Skipping daily report.`);
      return;
    }

    // Send email
    await this.mailService.sendDailyReport(targetEmail, highPriorityTasks);
    this.logger.log(`Daily report sent successfully to ${targetEmail}.`);
  }
}
