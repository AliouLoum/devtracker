import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @Get()
  getMembers(@Param('projectId') projectId: string, @Request() req: any) {
    return this.projectMembersService.getMembers(projectId, req.user.userId);
  }

  @Post()
  addMember(
    @Param('projectId') projectId: string,
    @Body('email') email: string,
    @Request() req: any,
  ) {
    return this.projectMembersService.addMember(projectId, email, req.user.userId);
  }

  @Delete(':userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.projectMembersService.removeMember(projectId, userId, req.user.userId);
  }
}
