import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { TaskWithProject, TasksService } from '../tasks/tasks.service';

export interface DashboardResponse {
  totalProjects: number;
  todayTasksCount: number;
  overdueTasksCount: number;
  globalProgress: number;
  upcomingTasks: TaskWithProject[];
  todayTasks: TaskWithProject[];
  overdueTasks: TaskWithProject[];
  tasksByPriority: { name: string; count: number; color: string }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly tasksService: TasksService,
  ) {}

  async getDashboard(userId: string): Promise<DashboardResponse> {
    const totalProjects = await this.projectsRepository.count({
      where: { userId },
    });

    const todayTasks = await this.tasksService.findToday(userId);
    const overdueTasks = await this.tasksService.findOverdue(userId);

    const allTasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .getMany();

    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === TaskStatus.DONE).length;
    const globalProgress =
      total === 0 ? 0 : Math.round((done / total) * 100);

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .andWhere('(task.dueDate >= :today OR task.dueDate IS NULL)', { today })
      .orderBy('task.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC')
      .limit(5)
      .getMany();

    const upcomingTasks = upcoming.map((t) => ({
      ...t,
      projectName: t.project?.name ?? 'Inbox',
      projectColor: t.project?.color ?? '#64748b',
    })) as TaskWithProject[];

    // Calculate tasks by priority
    const priorityMap = new Map<string, { name: string; count: number; color: string }>();
    priorityMap.set('high', { name: 'High', count: 0, color: '#ef4444' });
    priorityMap.set('medium', { name: 'Medium', count: 0, color: '#f97316' });
    priorityMap.set('low', { name: 'Low', count: 0, color: '#3b82f6' });
    
    for (const t of allTasks) {
      if (t.status !== TaskStatus.DONE && priorityMap.has(t.priority)) {
        priorityMap.get(t.priority)!.count++;
      }
    }
    const tasksByPriority = Array.from(priorityMap.values());

    return {
      totalProjects,
      todayTasksCount: todayTasks.length,
      overdueTasksCount: overdueTasks.length,
      globalProgress,
      upcomingTasks,
      todayTasks,
      overdueTasks,
      tasksByPriority,
    };
  }

  async getHeatmap(userId: string, year: number) {
    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end = new Date(`${year}-12-31T23:59:59Z`);

    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.status = :done', { done: TaskStatus.DONE })
      .andWhere('task.updatedAt BETWEEN :start AND :end', { start, end })
      .getMany();

    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const dateStr = task.updatedAt.toISOString().slice(0, 10);
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    }

    // Generate full year array
    const result = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10);
      result.push({
        date: dateStr,
        count: counts[dateStr] || 0,
      });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  async getHeatmapDay(userId: string, date: string) {
    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(`${date}T23:59:59Z`);
    
    return this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.status = :done', { done: TaskStatus.DONE })
      .andWhere('task.updatedAt BETWEEN :start AND :end', { start, end })
      .getMany();
  }
}
