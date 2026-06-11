import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TimeEntry } from '../tasks/entities/time-entry.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async startTimer(userId: string, taskId: string) {
    const task = await this.taskRepository.findOne({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');

    // Check if there is already an active timer
    const activeTimer = await this.timeEntryRepository.findOne({
      where: { userId, endTime: IsNull() },
    });

    if (activeTimer) {
      // Stop it automatically
      await this.stopTimer(userId, activeTimer.taskId);
    }

    const entry = this.timeEntryRepository.create({
      userId,
      taskId,
      startTime: new Date(),
    });

    return this.timeEntryRepository.save(entry);
  }

  async stopTimer(userId: string, taskId: string) {
    const activeTimer = await this.timeEntryRepository.findOne({
      where: { userId, taskId, endTime: IsNull() },
    });

    if (!activeTimer) {
      throw new BadRequestException('No active timer for this task');
    }

    activeTimer.endTime = new Date();
    const durationMs = activeTimer.endTime.getTime() - activeTimer.startTime.getTime();
    const durationSeconds = Math.round(durationMs / 1000);

    await this.timeEntryRepository.save(activeTimer);

    // Add to task's timeSpentSeconds
    const task = await this.taskRepository.findOne({ where: { id: taskId, userId } });
    if (task) {
      task.timeSpentSeconds += durationSeconds;
      await this.taskRepository.save(task);
    }

    return activeTimer;
  }

  async getCurrentTimer(userId: string) {
    return this.timeEntryRepository.findOne({
      where: { userId, endTime: IsNull() },
      relations: ['task'],
    });
  }
}
