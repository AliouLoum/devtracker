import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyReportService } from './weekly-report.service';
import { WeeklyReportController } from './weekly-report.controller';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TimeEntry } from '../tasks/entities/time-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, TimeEntry])],
  controllers: [WeeklyReportController],
  providers: [WeeklyReportService],
})
export class WeeklyReportModule {}
