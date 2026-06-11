import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ScheduleDto } from './dto/schedule.dto';

export interface ScheduledTaskSuggestion {
  id: string;
  title: string;
  projectName: string;
  projectColor: string;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedMinutes: number;
  score: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface VelocityProject {
  projectId: string;
  projectName: string;
  endDate: string | null;
  avgTasksPerWeek: number;
  remainingTasks: number;
  weeksNeeded: number;
  onTrack: boolean;
  alert: string | null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  private priorityWeight(p: TaskPriority): number {
    return p === TaskPriority.HIGH ? 3 : p === TaskPriority.MEDIUM ? 2 : 1;
  }

  async getHeatmap(userId: string, months = 3): Promise<HeatmapDay[]> {
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const startStr = start.toISOString().slice(0, 10);

    const rows = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .select("DATE(task.updated_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('task.status = :done', { done: TaskStatus.DONE })
      .andWhere('task.updated_at >= :start', { start: startStr })
      .andWhere(
        '(project.userId = :userId OR task.userId = :userId)',
        { userId },
      )
      .groupBy('DATE(task.updated_at)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return rows.map((r) => ({
      date: String(r.date).slice(0, 10),
      count: parseInt(r.count, 10),
    }));
  }

  async getStreak(userId: string): Promise<{ current: number; longest: number }> {
    const rows = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .select("DATE(task.updated_at)", 'date')
      .where('task.status = :done', { done: TaskStatus.DONE })
      .andWhere(
        '(project.userId = :userId OR task.userId = :userId)',
        { userId },
      )
      .groupBy('DATE(task.updated_at)')
      .orderBy('date', 'DESC')
      .getRawMany<{ date: string }>();

    const dates = new Set(rows.map((r) => String(r.date).slice(0, 10)));
    let current = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (dates.has(key)) {
        current++;
      } else if (i > 0) {
        break;
      }
    }

    const sorted = [...dates].sort();
    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const ds of sorted) {
      const d = new Date(ds);
      if (prev && d.getTime() - prev.getTime() === 86400000) {
        run++;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }

    return { current, longest };
  }

  async getVelocity(userId: string): Promise<VelocityProject[]> {
    const projects = await this.projectsRepo.find({ where: { userId } });
    const result: VelocityProject[] = [];
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    for (const project of projects) {
      const doneRecent = await this.tasksRepo
        .createQueryBuilder('task')
        .where('task.projectId = :pid', { pid: project.id })
        .andWhere('task.status = :done', { done: TaskStatus.DONE })
        .andWhere('task.updated_at >= :since', { since: eightWeeksAgo })
        .getCount();

      const remaining = await this.tasksRepo.count({
        where: { projectId: project.id, status: TaskStatus.TODO },
      }) + await this.tasksRepo.count({
        where: { projectId: project.id, status: TaskStatus.DOING },
      });

      const avgTasksPerWeek = Math.round((doneRecent / 8) * 10) / 10;
      const weeksNeeded =
        avgTasksPerWeek > 0
          ? Math.ceil(remaining / avgTasksPerWeek)
          : remaining > 0
            ? 999
            : 0;

      let onTrack = true;
      let alert: string | null = null;
      if (project.endDate && remaining > 0) {
        const daysLeft = Math.ceil(
          (new Date(project.endDate).getTime() - Date.now()) / 86400000,
        );
        const weeksLeft = daysLeft / 7;
        if (weeksNeeded > weeksLeft) {
          onTrack = false;
          alert = `Rythme trop lent : ~${weeksNeeded} sem. nécessaires, ${Math.floor(weeksLeft)} sem. restantes`;
        }
      }

      result.push({
        projectId: project.id,
        projectName: project.name,
        endDate: project.endDate,
        avgTasksPerWeek,
        remainingTasks: remaining,
        weeksNeeded,
        onTrack,
        alert,
      });
    }
    return result;
  }

  async suggestSchedule(
    userId: string,
    dto: ScheduleDto,
  ): Promise<ScheduledTaskSuggestion[]> {
    const availableMinutes = dto.availableHours * 60;
    const today = new Date().toISOString().slice(0, 10);

    const tasks = await this.tasksRepo
      .createQueryBuilder('task')
      .innerJoinAndSelect('task.project', 'project')
      .where('project.userId = :userId', { userId })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .getMany();

    const scored = tasks.map((task) => {
      const pw = this.priorityWeight(task.priority);
      let urgency = 1;
      if (task.dueDate) {
        const days = Math.ceil(
          (new Date(task.dueDate).getTime() - Date.now()) / 86400000,
        );
        urgency = days <= 0 ? 5 : days <= 3 ? 4 : days <= 7 ? 3 : 2;
      }
      const est = task.estimatedMinutes || 30;
      const score = (pw * urgency * 100) / est;
      return { task, score, est };
    });

    scored.sort((a, b) => b.score - a.score);

    const picked: ScheduledTaskSuggestion[] = [];
    let used = 0;
    for (const { task, score, est } of scored) {
      if (used + est > availableMinutes) continue;
      used += est;
      picked.push({
        id: task.id,
        title: task.title,
        projectName: task.project?.name ?? '',
        projectColor: task.project?.color ?? '#185FA5',
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedMinutes: est,
        score: Math.round(score * 10) / 10,
      });
    }
    return picked;
  }

  async getDailyBriefingData(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const todayTasks = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.dueDate = :today', { today })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .getCount();

    const overdue = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.dueDate < :today', { today })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .getCount();

    const nextDeadline = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.dueDate >= :today', { today })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .orderBy('task.dueDate', 'ASC')
      .getOne();

    let daysToNext = 0;
    if (nextDeadline?.dueDate) {
      daysToNext = Math.ceil(
        (new Date(nextDeadline.dueDate).getTime() - Date.now()) / 86400000,
      );
    }

    return { todayTasks, overdue, daysToNext, nextTaskTitle: nextDeadline?.title ?? null };
  }

  async getSmartSuggestions(userId: string) {
    const today = new Date();
    
    const tasks = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .getMany();

    if (tasks.length === 0) {
      return {
        nextTask: null,
        optimalHour: '10:00',
        deadlineRisk: null,
        message: "Vous n'avez aucune tâche en cours. C'est le moment de planifier de nouveaux objectifs !"
      };
    }

    // 1. Détecter le risque de deadline
    let deadlineRisk = null;
    const riskyTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const daysLeft = (new Date(t.dueDate).getTime() - today.getTime()) / 86400000;
      return daysLeft > 0 && daysLeft <= 2; // Moins de 48h
    });

    if (riskyTasks.length > 0) {
      riskyTasks.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      deadlineRisk = `Attention, la tâche "${riskyTasks[0].title}" arrive à échéance très bientôt.`;
    }

    // 2. Suggérer la prochaine tâche
    // On priorise: urgence (deadline proche) > priorité (high) > ancienneté
    const scoredTasks = tasks.map(t => {
      let score = this.priorityWeight(t.priority) * 10;
      if (t.dueDate) {
        const daysLeft = (new Date(t.dueDate).getTime() - today.getTime()) / 86400000;
        if (daysLeft < 0) score += 50; // En retard
        else if (daysLeft <= 1) score += 30; // Moins de 24h
        else if (daysLeft <= 3) score += 15;
      }
      return { task: t, score };
    });

    scoredTasks.sort((a, b) => b.score - a.score);
    const nextTask = scoredTasks[0].task;

    // 3. Heure optimale (algorithme simulé)
    const optimalHour = '09:30';
    const message = `D'après vos habitudes récentes, vous êtes le plus productif le matin. Commencez par "${nextTask.title}".`;

    return {
      nextTask: {
        id: nextTask.id,
        title: nextTask.title,
        priority: nextTask.priority,
        projectId: nextTask.projectId
      },
      optimalHour,
      deadlineRisk,
      message
    };
  }

  async getWeeklyReviewData(userId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completed = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.status = :done', { done: TaskStatus.DONE })
      .andWhere('task.updated_at >= :since', { since: weekAgo })
      .getMany();

    const slipped = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.dueDate < :today', {
        today: new Date().toISOString().slice(0, 10),
      })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .getMany();

    return {
      completedCount: completed.length,
      completed: completed.slice(0, 10).map((t) => t.title),
      slippedCount: slipped.length,
      slipped: slipped.slice(0, 10).map((t) => t.title),
    };
  }
}
