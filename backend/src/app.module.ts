import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotesModule } from './notes/notes.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { SeedRunnerService } from './database/seed-runner.service';
import { AiModule } from './ai/ai.module';
import { DriveModule } from './drive/drive.module';
import { GithubModule } from './github/github.module';
import { RecurrenceModule } from './recurrence/recurrence.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { WeeklyReportModule } from './weekly-report/weekly-report.module';
import { EventsModule } from './events/events.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { TaskCommentsModule } from './task-comments/task-comments.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '..', '.env'),
        join(process.cwd(), '.env'),
        join(__dirname, '..', '..', '.env'),
        join(__dirname, '..', '.env'),
      ],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get<string>('DATABASE_USER', 'devtracker'),
        password: config.get<string>('DATABASE_PASSWORD', 'devtracker'),
        database: config.get<string>('DATABASE_NAME', 'devtracker'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
    NotificationsModule,
    NotesModule,
    IntelligenceModule,
    AiModule,
    DriveModule,
    GithubModule,
    RecurrenceModule,
    TimeTrackingModule,
    WeeklyReportModule,
    EventsModule,
    ProjectMembersModule,
    TaskCommentsModule,
    MailModule,
  ],
  providers: [SeedRunnerService],
})
export class AppModule {}
