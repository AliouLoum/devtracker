import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GithubService } from './github.service';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('github')
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('repos')
  async listUserRepos(@Req() req: AuthRequest) {
    return this.githubService.listUserRepos(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sync-projects')
  async syncProjects(@Req() req: AuthRequest, @Body() body: { selectedRepos?: string[] }) {
    return this.githubService.syncReposAsProjects(req.user.userId, body?.selectedRepos);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('link/:projectId')
  async linkProject(
    @Req() req: AuthRequest,
    @Param('projectId') projectId: string,
    @Body() body: { owner: string; repo: string },
  ) {
    return this.githubService.linkProject(req.user.userId, projectId, body.owner, body.repo);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('contents/:projectId')
  async getRepoContent(
    @Req() req: AuthRequest, 
    @Param('projectId') projectId: string,
    @Req() request: any
  ) {
    const path = request.query.path as string || '';
    return this.githubService.getRepoContent(req.user.userId, projectId, path);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('commits/:projectId')
  async getRecentCommits(@Req() req: AuthRequest, @Param('projectId') projectId: string) {
    return this.githubService.getRecentCommits(req.user.userId, projectId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('issues/:taskId')
  async pushTaskToIssue(@Req() req: AuthRequest, @Param('taskId') taskId: string) {
    return this.githubService.pushTaskToIssue(req.user.userId, taskId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('issues/:projectId')
  async getOpenIssues(@Req() req: AuthRequest, @Param('projectId') projectId: string) {
    return this.githubService.getOpenIssues(req.user.userId, projectId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('import-selected/:projectId')
  async importSelectedIssuesAsTasks(
    @Req() req: AuthRequest, 
    @Param('projectId') projectId: string,
    @Body() body: { issueNumbers: number[] }
  ) {
    return this.githubService.importSelectedIssuesAsTasks(req.user.userId, projectId, body.issueNumbers);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('import/:projectId')
  async importIssuesAsTasks(@Req() req: AuthRequest, @Param('projectId') projectId: string) {
    // We keep this for backward compatibility if needed, or it can be removed.
    // Let's redirect to importing all open issues
    const issues = await this.githubService.getOpenIssues(req.user.userId, projectId);
    return this.githubService.importSelectedIssuesAsTasks(req.user.userId, projectId, issues.map(i => i.number));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('commit-message/:taskId')
  async generateCommitMessage(@Req() req: AuthRequest, @Param('taskId') taskId: string) {
    return this.githubService.generateCommitMessage(req.user.userId, taskId);
  }

  /**
   * Public webhook endpoint for GitHub events
   */
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.githubService.handleWebhook(body);
  }
}
