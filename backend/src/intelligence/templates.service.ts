import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { TaskTemplate, TemplateTaskItem } from './entities/task-template.entity';
import { ProjectsService } from '../projects/projects.service';

export class CreateTemplateDto {
  name!: string;
  description?: string;
  tasksJson!: TemplateTaskItem[];
}

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(TaskTemplate)
    private readonly templatesRepo: Repository<TaskTemplate>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    private readonly projectsService: ProjectsService,
  ) {}

  findAll(userId: string): Promise<TaskTemplate[]> {
    return this.templatesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, dto: CreateTemplateDto): Promise<TaskTemplate> {
    return this.templatesRepo.save({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      tasksJson: dto.tasksJson,
    });
  }

  async apply(
    userId: string,
    templateId: string,
    projectId: string,
  ): Promise<Task[]> {
    const template = await this.templatesRepo.findOne({
      where: { id: templateId, userId },
    });
    if (!template) throw new NotFoundException('Template not found');
    await this.projectsService.findOwnedProject(userId, projectId);

    const created: Task[] = [];
    const base = new Date();
    for (const item of template.tasksJson) {
      let dueDate: string | null = null;
      if (item.dueDateOffsetDays !== undefined) {
        const d = new Date(base);
        d.setDate(d.getDate() + item.dueDateOffsetDays);
        dueDate = d.toISOString().slice(0, 10);
      }
      const task = await this.tasksRepo.save(
        this.tasksRepo.create({
          userId,
          projectId,
          title: item.title,
          notes: item.notes ?? null,
          dueDate,
          priority: item.priority ?? undefined,
          status: item.status ?? TaskStatus.TODO,
          estimatedMinutes: item.estimatedMinutes ?? 30,
          isInbox: false,
        } as Partial<Task>),
      );
      created.push(task);
    }
    return created;
  }

  async remove(userId: string, id: string): Promise<void> {
    const t = await this.templatesRepo.findOne({ where: { id, userId } });
    if (!t) throw new NotFoundException('Template not found');
    await this.templatesRepo.remove(t);
  }
}
