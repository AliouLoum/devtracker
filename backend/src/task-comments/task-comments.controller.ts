import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Get()
  getComments(@Param('taskId') taskId: string) {
    return this.taskCommentsService.getComments(taskId);
  }

  @Post()
  addComment(
    @Param('taskId') taskId: string,
    @Body('content') content: string,
    @Request() req: any,
  ) {
    return this.taskCommentsService.addComment(taskId, content, req.user.userId);
  }

  @Delete(':commentId')
  removeComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    return this.taskCommentsService.removeComment(commentId, req.user.userId);
  }
}
