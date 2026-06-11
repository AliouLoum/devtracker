import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { TasksModule } from '../tasks/tasks.module';
import { Task } from '../tasks/entities/task.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Task]), TasksModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
