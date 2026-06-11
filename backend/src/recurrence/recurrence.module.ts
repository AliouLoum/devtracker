import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { RecurrenceCronService } from './recurrence.cron';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  providers: [RecurrenceCronService],
})
export class RecurrenceModule {}
