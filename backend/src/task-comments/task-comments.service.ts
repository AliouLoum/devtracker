import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from '../tasks/entities/task-comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private commentsRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private eventsGateway: EventsGateway,
  ) {}

  async getComments(taskId: string) {
    return this.commentsRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(taskId: string, content: string, userId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = this.commentsRepository.create({
      taskId,
      content,
      userId,
    });

    const savedComment = await this.commentsRepository.save(comment);
    
    // Fetch with relations for broadcast
    const fullComment = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });

    if (task.projectId) {
      this.eventsGateway.emitToProject(task.projectId, 'comment:created', fullComment);
    }

    return fullComment;
  }

  async removeComment(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, userId },
      relations: ['task'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or unauthorized');
    }

    const projectId = comment.task?.projectId;
    const taskId = comment.taskId;

    await this.commentsRepository.delete(commentId);

    if (projectId) {
      this.eventsGateway.emitToProject(projectId, 'comment:deleted', { commentId, taskId });
    }
  }
}
