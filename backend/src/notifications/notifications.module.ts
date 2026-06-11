import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { UserSettings } from '../intelligence/entities/user-settings.entity';
import { NotificationsGateway } from './notifications.gateway';
import { DesktopNotificationService } from './desktop.service';
import { EmailNotificationService } from './email.service';
import { NotificationsCron } from './notifications.cron';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    TypeOrmModule.forFeature([Task, Project, User, UserSettings]),
  ],
  providers: [
    NotificationsGateway,
    DesktopNotificationService,
    EmailNotificationService,
    NotificationsCron,
  ],
  exports: [
    NotificationsGateway,
    DesktopNotificationService,
    EmailNotificationService,
    NotificationsCron,
  ],
})
export class NotificationsModule {}
