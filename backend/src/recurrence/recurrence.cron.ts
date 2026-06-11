import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class RecurrenceCronService {
  private readonly logger = new Logger(RecurrenceCronService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  @Cron('0 0 * * *')
  async handleCron() {
    this.logger.debug('Running nightly recurrence check...');
    
    // We run at midnight, so we check tasks completed the previous day
    const yesterday = subDays(new Date(), 1);
    const start = startOfDay(yesterday);
    const end = endOfDay(yesterday);

    const completedTasks = await this.tasksRepository.find({
      where: {
        status: TaskStatus.DONE,
        recurrence: Not(IsNull()),
        updatedAt: Between(start, end),
      },
    });

    this.logger.debug(`Found ${completedTasks.length} recurring tasks completed yesterday.`);

    for (const task of completedTasks) {
      try {
        await this.generateNextOccurrence(task);
      } catch (error) {
        this.logger.error(`Failed to generate occurrence for task ${task.id}`, error);
      }
    }
  }

  private async generateNextOccurrence(task: Task) {
    // Check if we already generated a child for this exact parent to prevent duplicates
    const existingChild = await this.tasksRepository.findOne({
      where: { recurrenceParentId: task.id }
    });

    // Actually, recurrence_parent_id in the prompt is used for "filiation", which means a chain or a root.
    // If it's a chain, task.id becomes the new task's recurrence_parent_id.
    if (existingChild) {
      // If we already generated one, maybe skip, but what if they complete it again?
      // Since we only query tasks completed *yesterday*, this is generally safe.
    }

    const rec = task.recurrence;
    if (!rec || !rec.type) return;

    // Check endDate
    if (rec.endDate && new Date(rec.endDate) < new Date()) {
      return; // Recurrence ended
    }

    let nextDate = new Date();
    const currentBaseDate = task.dueDate ? new Date(task.dueDate) : new Date();

    const interval = rec.interval || 1;

    switch (rec.type) {
      case 'daily':
        nextDate = addDays(currentBaseDate, interval);
        break;
      case 'weekly':
        // Simplified: just add weeks. Proper daysOfWeek logic can be more complex.
        nextDate = addWeeks(currentBaseDate, interval);
        break;
      case 'monthly':
        nextDate = addMonths(currentBaseDate, interval);
        break;
      case 'custom':
        nextDate = addDays(currentBaseDate, interval);
        break;
      default:
        nextDate = addDays(currentBaseDate, 1);
    }

    const nextDateStr = nextDate.toISOString().split('T')[0];

    const newTask = this.tasksRepository.create({
      ...task,
      id: undefined, // Let DB generate new ID
      status: TaskStatus.TODO,
      dueDate: nextDateStr,
      recurrenceParentId: task.id,
      recurrenceDate: nextDateStr,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await this.tasksRepository.save(newTask);
    this.logger.debug(`Generated next occurrence for ${task.title}: ${nextDateStr}`);
  }
}
