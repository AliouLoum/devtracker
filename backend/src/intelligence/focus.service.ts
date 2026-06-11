import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { TaskLink } from './entities/task-link.entity';
import { FocusCompleteDto } from './dto/focus.dto';

@Injectable()
export class FocusService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(TaskLink)
    private readonly linksRepo: Repository<TaskLink>,
  ) {}

  async recordFocus(userId: string, dto: FocusCompleteDto): Promise<Task> {
    const task = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('task.id = :id', { id: dto.taskId })
      .andWhere('(project.userId = :userId OR task.userId = :userId)', {
        userId,
      })
      .getOne();
    if (!task) throw new NotFoundException('Task not found');
    if (dto.sessionType !== 'break') {
      task.timeSpentSeconds += dto.durationSeconds;
    }
    return this.tasksRepo.save(task);
  }

  async syncNoteLinks(
    userId: string,
    sourceTaskId: string,
    notes: string,
  ): Promise<void> {
    const mentions = [...notes.matchAll(/@([\w\s-]+)/g)].map((m) =>
      m[1].trim().toLowerCase(),
    );
    if (mentions.length === 0) return;

    const userTasks = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('(project.userId = :userId OR task.userId = :userId)', { userId })
      .andWhere('task.id != :sourceId', { sourceId: sourceTaskId })
      .getMany();

    await this.linksRepo.delete({ sourceTaskId });

    for (const mention of mentions) {
      const target = userTasks.find((t) =>
        t.title.toLowerCase().includes(mention),
      );
      if (target) {
        await this.linksRepo.save({
          sourceTaskId,
          targetTaskId: target.id,
        });
      }
    }
  }

  async getLinkedTasks(taskId: string): Promise<Task[]> {
    const links = await this.linksRepo.find({
      where: { sourceTaskId: taskId },
      relations: ['targetTask'],
    });
    return links.map((l) => l.targetTask);
  }
}
