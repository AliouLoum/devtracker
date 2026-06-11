import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Note } from '../notes/entities/note.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { UserSettings } from './entities/user-settings.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    @InjectRepository(TaskTemplate)
    private readonly templatesRepo: Repository<TaskTemplate>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
  ) {}

  async exportAll(userId: string) {
    const projects = await this.projectsRepo.find({ where: { userId } });
    const tasks = await this.tasksRepo
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .where('project.userId = :userId OR task.userId = :userId', { userId })
      .getMany();
    const notes = await this.notesRepo.find({ where: { userId } });
    const templates = await this.templatesRepo.find({ where: { userId } });
    const settings = await this.settingsRepo.findOne({ where: { userId } });

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
      notes,
      templates,
      settings,
    };
  }

  async exportGithubIssues(userId: string, projectId: string) {
    await this.projectsRepo.findOneOrFail({ where: { id: projectId, userId } });
    const tasks = await this.tasksRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
    return tasks.map((t) => ({
      title: t.title,
      body: [t.notes, t.dueDate ? `Due: ${t.dueDate}` : '', `Priority: ${t.priority}`]
        .filter(Boolean)
        .join('\n\n'),
      labels: [`priority-${t.priority}`, `status-${t.status}`],
    }));
  }
}
