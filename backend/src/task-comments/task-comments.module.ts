import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskCommentsService } from './task-comments.service';
import { TaskCommentsController } from './task-comments.controller';
import { TaskComment } from '../tasks/entities/task-comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskComment, Task]),
    EventsModule
  ],
  controllers: [TaskCommentsController],
  providers: [TaskCommentsService],
})
export class TaskCommentsModule {}
