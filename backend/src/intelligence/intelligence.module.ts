import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Note } from '../notes/entities/note.entity';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserSettings } from './entities/user-settings.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { TaskLink } from './entities/task-link.entity';
import { IntelligenceController } from './intelligence.controller';
import { AnalyticsService } from './analytics.service';
import { SettingsService } from './settings.service';
import { InboxService } from './inbox.service';
import { TemplatesService } from './templates.service';
import { ExportService } from './export.service';
import { FocusService } from './focus.service';
import { IntelligenceCron } from './intelligence.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Project,
      Note,
      UserSettings,
      TaskTemplate,
      TaskLink,
    ]),
    ProjectsModule,
    NotificationsModule,
  ],
  controllers: [IntelligenceController],
  providers: [
    AnalyticsService,
    SettingsService,
    InboxService,
    TemplatesService,
    ExportService,
    FocusService,
    IntelligenceCron,
  ],
  exports: [FocusService, AnalyticsService],
})
export class IntelligenceModule {}
