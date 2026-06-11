import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { EventsModule } from '../events/events.module';
import { Project } from '../projects/entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskHistory } from './entities/task-history.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksCron } from './tasks.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project, TaskHistory]),
    ProjectsModule,
    NotificationsModule,
    IntelligenceModule,
    EventsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksCron],
  exports: [TasksService],
})
export class TasksModule {}
