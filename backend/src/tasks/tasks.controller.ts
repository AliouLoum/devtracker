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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiQuery({ name: 'projectId', required: true })
  findByProject(
    @Req() req: AuthRequest,
    @Query('projectId') projectId: string,
  ) {
    return this.tasksService.findByProject(req.user.userId, projectId);
  }
  @Get('scheduled')
  @ApiQuery({ name: 'date', example: '2026-05-23' })
  findScheduled(
    @Req() req: AuthRequest,
    @Query('date') date: string,
  ) {
    return this.tasksService.findScheduled(req.user.userId, date);
  }

  @Get('evolution')
  getEvolution(@Req() req: AuthRequest) {
    return this.tasksService.getTasksEvolution(req.user.userId);
  }

  @Get('all')
  findAll(@Req() req: AuthRequest) {
    return this.tasksService.findAll(req.user.userId);
  }

  @Get('today')
  findToday(@Req() req: AuthRequest) {
    return this.tasksService.findToday(req.user.userId);
  }

  @Get('overdue')
  findOverdue(@Req() req: AuthRequest) {
    return this.tasksService.findOverdue(req.user.userId);
  }

  @Get('calendar')
  @ApiQuery({ name: 'month', example: '2026-05' })
  findCalendar(
    @Req() req: AuthRequest,
    @Query('month') month: string,
  ) {
    return this.tasksService.findCalendar(req.user.userId, month);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tasksService.findOne(req.user.userId, id);
  }

  @Get(':id/subtasks')
  findSubtasks(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tasksService.findSubtasks(req.user.userId, id);
  }

  @Post(':id/subtasks')
  createSubtask(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.createSubtask(req.user.userId, id, dto);
  }

  @Patch(':id/recurrence')
  updateRecurrence(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { recurrence: any },
  ) {
    return this.tasksService.updateRecurrence(req.user.userId, id, body.recurrence);
  }

  @Delete(':id/recurrence')
  removeRecurrence(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tasksService.updateRecurrence(req.user.userId, id, null);
  }

  @Patch(':id/schedule')
  updateSchedule(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { scheduledAt: string | null },
  ) {
    return this.tasksService.updateSchedule(
      req.user.userId,
      id,
      body.scheduledAt,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(req.user.userId, id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tasksService.remove(req.user.userId, id);
  }
}
