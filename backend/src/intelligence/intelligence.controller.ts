import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { SettingsService } from './settings.service';
import { InboxService } from './inbox.service';
import { TemplatesService, CreateTemplateDto } from './templates.service';
import { ExportService } from './export.service';
import { FocusService } from './focus.service';
import { ScheduleDto } from './dto/schedule.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  AssignInboxDto,
  FocusCompleteDto,
  InboxCaptureDto,
} from './dto/focus.dto';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('intelligence')
export class IntelligenceController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly settings: SettingsService,
    private readonly inbox: InboxService,
    private readonly templates: TemplatesService,
    private readonly exportService: ExportService,
    private readonly focus: FocusService,
  ) {}

  @Get('heatmap')
  @ApiQuery({ name: 'months', required: false })
  heatmap(@Req() req: AuthRequest, @Query('months') months?: string) {
    return this.analytics.getHeatmap(
      req.user.userId,
      months ? parseInt(months, 10) : 3,
    );
  }

  @Get('velocity')
  velocity(@Req() req: AuthRequest) {
    return this.analytics.getVelocity(req.user.userId);
  }

  @Get('streak')
  streak(@Req() req: AuthRequest) {
    return this.analytics.getStreak(req.user.userId);
  }

  @Post('schedule')
  schedule(@Req() req: AuthRequest, @Body() dto: ScheduleDto) {
    return this.analytics.suggestSchedule(req.user.userId, dto);
  }

  @Get('briefing')
  briefing(@Req() req: AuthRequest) {
    return this.analytics.getDailyBriefingData(req.user.userId);
  }

  @Get('suggestions')
  suggestions(@Req() req: AuthRequest) {
    return this.analytics.getSmartSuggestions(req.user.userId);
  }

  @Get('weekly-review')
  weeklyReview(@Req() req: AuthRequest) {
    return this.analytics.getWeeklyReviewData(req.user.userId);
  }

  @Get('settings')
  getSettings(@Req() req: AuthRequest) {
    return this.settings.getOrCreate(req.user.userId);
  }

  @Patch('settings')
  updateSettings(@Req() req: AuthRequest, @Body() dto: UpdateSettingsDto) {
    return this.settings.update(req.user.userId, dto);
  }

  @Get('inbox')
  inboxList(@Req() req: AuthRequest) {
    return this.inbox.findInbox(req.user.userId);
  }

  @Post('inbox')
  inboxCapture(@Req() req: AuthRequest, @Body() dto: InboxCaptureDto) {
    return this.inbox.capture(req.user.userId, dto);
  }

  @Patch('inbox/:id/assign')
  inboxAssign(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AssignInboxDto,
  ) {
    return this.inbox.assign(req.user.userId, id, dto);
  }

  @Delete('inbox/:id')
  inboxRemove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.inbox.remove(req.user.userId, id);
  }

  @Get('templates')
  templateList(@Req() req: AuthRequest) {
    return this.templates.findAll(req.user.userId);
  }

  @Post('templates')
  templateCreate(@Req() req: AuthRequest, @Body() dto: CreateTemplateDto) {
    return this.templates.create(req.user.userId, dto);
  }

  @Post('templates/:id/apply')
  templateApply(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { projectId: string },
  ) {
    return this.templates.apply(req.user.userId, id, body.projectId);
  }

  @Delete('templates/:id')
  templateRemove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.templates.remove(req.user.userId, id);
  }

  @Get('export/json')
  exportJson(@Req() req: AuthRequest) {
    return this.exportService.exportAll(req.user.userId);
  }

  @Get('export/github-issues')
  exportGithub(
    @Req() req: AuthRequest,
    @Query('projectId') projectId: string,
  ) {
    return this.exportService.exportGithubIssues(req.user.userId, projectId);
  }

  @Post('focus/complete')
  focusComplete(@Req() req: AuthRequest, @Body() dto: FocusCompleteDto) {
    return this.focus.recordFocus(req.user.userId, dto);
  }

  @Get('tasks/:id/links')
  taskLinks(@Param('id') id: string) {
    return this.focus.getLinkedTasks(id);
  }
}
