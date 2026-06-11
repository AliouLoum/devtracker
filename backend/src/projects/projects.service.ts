import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export interface ProjectWithProgress extends Project {
  progress: number;
  totalTasks: number;
  doneTasks: number;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  private computeProgress(tasks: Task[]): {
    progress: number;
    totalTasks: number;
    doneTasks: number;
  } {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progress =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    return { progress, totalTasks, doneTasks };
  }

  async findAllForUser(userId: string): Promise<ProjectWithProgress[]> {
    const projects = await this.projectsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const result: ProjectWithProgress[] = [];
    for (const project of projects) {
      const tasks = await this.tasksRepository.find({
        where: { projectId: project.id },
      });
      const stats = this.computeProgress(tasks);
      result.push({ ...project, ...stats });
    }
    return result;
  }

  async findOneForUser(
    userId: string,
    id: string,
  ): Promise<ProjectWithProgress> {
    const project = await this.projectsRepository.findOne({
      where: { id, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const tasks = await this.tasksRepository.find({
      where: { projectId: project.id },
    });
    return { ...project, ...this.computeProgress(tasks) };
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create({
      userId,
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color ?? '#185FA5',
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      hoursPerWeek: dto.hoursPerWeek ?? null,
      estimatedWeeks: dto.estimatedWeeks ?? null,
      status: dto.status,
      githubRepoOwner: dto.githubRepoOwner ?? null,
      githubRepoName: dto.githubRepoName ?? null,
    });
    return this.projectsRepository.save(project);
  }

  async createDemoProject(userId: string): Promise<Project> {
    const project = this.projectsRepository.create({
      userId,
      name: '🚀 Projet de Démonstration',
      description: 'Découvrez toutes les fonctionnalités de DevTracker dans ce projet pré-rempli.',
      color: '#6366f1',
      status: 'active' as any,
    });
    
    const savedProject = await this.projectsRepository.save(project);

    const demoTasks = [
      {
        projectId: savedProject.id,
        title: 'Tester les raccourcis clavier (j, k, d, e)',
        status: TaskStatus.TODO,
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        notes: "Naviguez avec 'j' et 'k'. Marquez comme done avec 'd'.",
      },
      {
        projectId: savedProject.id,
        title: 'Essayer le drag and drop sur le Board',
        status: TaskStatus.DOING,
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      },
      {
        projectId: savedProject.id,
        title: 'Lancer le chronomètre Global',
        status: TaskStatus.TODO,
        priority: 'low',
        notes: "Cliquez sur Play en haut ou depuis la vue Side Peek de cette tâche.",
      }
    ];

    for (const task of demoTasks) {
      await this.tasksRepository.save(this.tasksRepository.create(task as any));
    }

    return savedProject;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOwnedProject(userId, id);
    Object.assign(project, dto);
    return this.projectsRepository.save(project);
  }

  async remove(userId: string, id: string): Promise<void> {
    const project = await this.findOwnedProject(userId, id);
    await this.projectsRepository.remove(project);
  }

  async findOwnedProject(userId: string, id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}
