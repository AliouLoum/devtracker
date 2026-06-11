import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskHistory } from './entities/task-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { FocusService } from '../intelligence/focus.service';
import { NotificationsCron } from '../notifications/notifications.cron';
import { EventsGateway } from '../events/events.gateway';

export interface TaskWithProject extends Task {
  projectName: string;
  projectColor: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private readonly taskHistoryRepository: Repository<TaskHistory>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly projectsService: ProjectsService,
    private readonly focusService: FocusService,
    private readonly notificationsCron: NotificationsCron,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async assertProjectOwnership(
    userId: string,
    projectId: string,
  ): Promise<Project> {
    return this.projectsService.findOwnedProject(userId, projectId);
  }

  private async findTaskForUser(userId: string, id: string): Promise<Task> {
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('task.id = :id', { id })
      .andWhere('(project.userId = :userId OR task.userId = :userId)', {
        userId,
      })
      .getOne();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private mapWithProject(task: Task, project: Project | null): TaskWithProject {
    return {
      ...task,
      projectName: project?.name ?? 'Inbox',
      projectColor: project?.color ?? '#64748b',
    };
  }

  async findByProject(userId: string, projectId: string) {
    return this.tasksRepository.find({
      where: { project: { id: projectId, userId }, parentTaskId: IsNull() },
      order: { createdAt: 'DESC' },
      relations: ['project', 'subtasks'],
    });
  }

  async findAll(userId: string) {
    return this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.parentTaskId IS NULL')
      .orderBy('task.createdAt', 'DESC')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .getMany();
  }

  async findScheduled(userId: string, date: string): Promise<TaskWithProject[]> {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.parentTaskId IS NULL')
      .andWhere('task.scheduledAt BETWEEN :start AND :end', { start, end })
      .orderBy('task.scheduledAt', 'ASC')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .getMany();
    return tasks.map((t) =>
      this.mapWithProject(t, t.project as Project),
    );
  }

  async findToday(userId: string): Promise<TaskWithProject[]> {
    const today = this.todayString();
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.parentTaskId IS NULL')
      .andWhere('task.dueDate = :today', { today })
      .orderBy('task.priority', 'ASC')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .getMany();
    return tasks.map((t) =>
      this.mapWithProject(t, t.project as Project),
    );
  }

  async findOverdue(userId: string): Promise<TaskWithProject[]> {
    const today = this.todayString();
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.parentTaskId IS NULL')
      .andWhere('task.dueDate < :today', { today })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .orderBy('task.dueDate', 'ASC')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .getMany();
    return tasks.map((t) =>
      this.mapWithProject(t, t.project as Project),
    );
  }

  async findCalendar(
    userId: string,
    month: string,
  ): Promise<Record<string, TaskWithProject[]>> {
    const [year, mon] = month.split('-').map(Number);
    const start = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const end = `${month}-${String(lastDay).padStart(2, '0')}`;

    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.parentTaskId IS NULL')
      .andWhere('task.dueDate BETWEEN :start AND :end', { start, end })
      .orderBy('task.dueDate', 'ASC')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .getMany();

    const grouped: Record<string, TaskWithProject[]> = {};
    for (const task of tasks) {
      const key = task.dueDate ?? 'unscheduled';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(
        this.mapWithProject(task, task.project as Project),
      );
    }
    return grouped;
  }

  async findOne(userId: string, id: string): Promise<TaskWithProject> {
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.id = :id', { id })
      .andWhere('(project.userId = :userId OR task.userId = :userId)', {
        userId,
      })
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.subtasks', 'subtasks')
      .orderBy('subtasks.createdAt', 'ASC')
      .getOne();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.mapWithProject(task, task.project);
  }

  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    if (dto.projectId) {
      await this.assertProjectOwnership(userId, dto.projectId);
    }
    const task = this.tasksRepository.create({
      userId: dto.projectId ? userId : userId,
      projectId: dto.projectId ?? null,
      isInbox: !dto.projectId,
      title: dto.title,
      notes: dto.notes ?? null,
      dueDate: dto.dueDate ?? null,
      priority: dto.priority,
      status: dto.status,
      estimatedMinutes: dto.estimatedMinutes ?? 30,
      reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : null,
      reminderSent: false,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      assigneeId: dto.assigneeId ?? null,
    });
    const savedTask = await this.tasksRepository.save(task);
    await this.taskHistoryRepository.save({
      taskId: savedTask.id,
      oldStatus: null,
      newStatus: savedTask.status,
    });
    return savedTask;
  }

  async findSubtasks(userId: string, taskId: string): Promise<Task[]> {
    const parent = await this.findTaskForUser(userId, taskId);
    return this.tasksRepository.find({
      where: { parentTaskId: parent.id },
      order: { createdAt: 'ASC' },
    });
  }

  async createSubtask(userId: string, taskId: string, dto: CreateTaskDto): Promise<Task> {
    const parent = await this.findTaskForUser(userId, taskId);
    const subtask = this.tasksRepository.create({
      userId: parent.userId,
      projectId: parent.projectId,
      parentTaskId: parent.id,
      isInbox: parent.isInbox,
      title: dto.title,
      notes: dto.notes ?? null,
      dueDate: dto.dueDate ?? null,
      priority: dto.priority,
      status: dto.status,
      estimatedMinutes: dto.estimatedMinutes ?? 30,
    });
    const savedTask = await this.tasksRepository.save(subtask);
    await this.taskHistoryRepository.save({
      taskId: savedTask.id,
      oldStatus: null,
      newStatus: savedTask.status,
    });
    return savedTask;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findTaskForUser(userId, id);
    const oldStatus = task.status;
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.notes !== undefined) {
      task.notes = dto.notes ?? null;
      await this.focusService.syncNoteLinks(userId, id, dto.notes ?? '');
    }
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ?? null;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.reminderAt !== undefined) {
      task.reminderAt = dto.reminderAt ? new Date(dto.reminderAt) : null;
      task.reminderSent = false;
    }
    if (dto.estimatedMinutes !== undefined) {
      task.estimatedMinutes = dto.estimatedMinutes;
    }
    if (dto.scheduledAt !== undefined) {
      task.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }
    if (dto.assigneeId !== undefined) {
      task.assigneeId = dto.assigneeId ?? null;
    }
    const savedTask = await this.tasksRepository.save(task);
    
    if (oldStatus !== savedTask.status) {
      await this.taskHistoryRepository.save({
        taskId: savedTask.id,
        oldStatus: oldStatus,
        newStatus: savedTask.status,
      });
    }
    
    if (savedTask.projectId) {
      this.eventsGateway.emitToProject(savedTask.projectId, 'task:updated', savedTask);
    }

    return savedTask;
  }

  async updateRecurrence(
    userId: string,
    id: string,
    recurrence: any | null,
  ): Promise<Task> {
    const task = await this.findTaskForUser(userId, id);
    task.recurrence = recurrence;
    return this.tasksRepository.save(task);
  }

  async updateSchedule(
    userId: string,
    id: string,
    scheduledAt: string | null,
  ): Promise<Task> {
    const task = await this.findTaskForUser(userId, id);
    task.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    return this.tasksRepository.save(task);
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const task = await this.findTaskForUser(userId, id);
    const oldStatus = task.status;
    task.status = dto.status;
    const updated = await this.tasksRepository.save(task);
    
    if (oldStatus !== updated.status) {
      await this.taskHistoryRepository.save({
        taskId: updated.id,
        oldStatus: oldStatus,
        newStatus: updated.status,
      });
    }
    
    if (updated.projectId) {
      this.notificationsCron.checkMilestones(updated.projectId).catch(() => {});
      this.eventsGateway.emitToProject(updated.projectId, 'task:updated', updated);
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.findTaskForUser(userId, id);
    await this.tasksRepository.remove(task);
  }

  async findDueReminders(): Promise<
    Array<Task & { project: Project; userId: string }>
  > {
    const now = new Date();
    return this.tasksRepository
      .createQueryBuilder('task')
      .innerJoinAndSelect('task.project', 'project')
      .where('task.reminderAt IS NOT NULL')
      .andWhere('task.reminderSent = false')
      .andWhere('task.reminderAt <= :now', { now })
      .getMany() as Promise<Array<Task & { project: Project; userId: string }>>;
  }

  async markReminderSent(id: string): Promise<void> {
    await this.tasksRepository.update(id, { reminderSent: true });
  }

  async getTasksEvolution(userId: string): Promise<any[]> {
    // Return hourly counts of created and completed tasks for the last 12 hours
    const result: any[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const startOfHour = new Date(now);
      startOfHour.setHours(startOfHour.getHours() - i, 0, 0, 0);
      
      const endOfHour = new Date(startOfHour);
      endOfHour.setHours(startOfHour.getHours(), 59, 59, 999);
      
      const createdCount = await this.taskHistoryRepository
        .createQueryBuilder('history')
        .innerJoin('history.task', 'task')
        .where('(task.userId = :userId OR task.project.userId = :userId)', { userId })
        .andWhere('history.oldStatus IS NULL')
        .andWhere('history.changedAt BETWEEN :start AND :end', { start: startOfHour, end: endOfHour })
        .getCount();
        
      const completedCount = await this.taskHistoryRepository
        .createQueryBuilder('history')
        .innerJoin('history.task', 'task')
        .where('(task.userId = :userId OR task.project.userId = :userId)', { userId })
        .andWhere('history.newStatus = :done', { done: TaskStatus.DONE })
        .andWhere('history.changedAt BETWEEN :start AND :end', { start: startOfHour, end: endOfHour })
        .getCount();
        
      result.push({
        date: startOfHour.toISOString(),
        created: createdCount,
        completed: completedCount
      });
    }
    return result;
  }
}
