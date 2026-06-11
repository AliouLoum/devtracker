import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { DailyReportCron } from './daily-report.cron';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

import { MailController } from './mail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, Task])],
  controllers: [MailController],
  providers: [MailService, DailyReportCron],
  exports: [MailService],
})
export class MailModule {}
