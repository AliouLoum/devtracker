import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { InboxCaptureDto, AssignInboxDto } from './dto/focus.dto';

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    private readonly projectsService: ProjectsService,
  ) {}

  findInbox(userId: string): Promise<Task[]> {
    return this.tasksRepo.find({
      where: { userId, isInbox: true },
      order: { createdAt: 'DESC' },
    });
  }

  async capture(userId: string, dto: InboxCaptureDto): Promise<Task> {
    const task = this.tasksRepo.create({
      userId,
      projectId: null,
      isInbox: true,
      title: dto.title,
      status: TaskStatus.TODO,
    });
    return this.tasksRepo.save(task);
  }

  async assign(
    userId: string,
    id: string,
    dto: AssignInboxDto,
  ): Promise<Task> {
    const task = await this.tasksRepo.findOne({
      where: { id, userId, isInbox: true },
    });
    if (!task) throw new NotFoundException('Inbox item not found');
    await this.projectsService.findOwnedProject(userId, dto.projectId);
    task.projectId = dto.projectId;
    task.isInbox = false;
    if (dto.dueDate) task.dueDate = dto.dueDate;
    return this.tasksRepo.save(task);
  }

  async remove(userId: string, id: string): Promise<void> {
    const task = await this.tasksRepo.findOne({
      where: { id, userId, isInbox: true },
    });
    if (!task) throw new NotFoundException('Inbox item not found');
    await this.tasksRepo.remove(task);
  }
}
