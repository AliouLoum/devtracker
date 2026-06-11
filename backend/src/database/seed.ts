import { config } from 'dotenv';
import { join } from 'path';
import * as bcrypt from 'bcryptjs';
import dataSource from '../data-source';
import { User } from '../users/entities/user.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task, TaskPriority, TaskStatus } from '../tasks/entities/task.entity';

config({ path: join(__dirname, '..', '..', '..', '.env') });

async function seed(): Promise<void> {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const projectRepo = dataSource.getRepository(Project);
  const taskRepo = dataSource.getRepository(Task);

  const email = 'demo@devtracker.local';
  let user = await userRepo.findOne({ where: { email } });
  if (!user) {
    const password = await bcrypt.hash('demo1234', 10);
    user = await userRepo.save({
      email,
      password,
      name: 'Demo User',
    });
    console.log('Created demo user');
  } else {
    console.log('Demo user already exists, skipping user creation');
  }

  let project = await projectRepo.findOne({
    where: { userId: user.id, name: 'DevFlow' },
  });

  if (!project) {
    project = await projectRepo.save({
      userId: user.id,
      name: 'DevFlow',
      description:
        'Application de gestion de projet fullstack Angular + NestJS',
      color: '#185FA5',
      startDate: '2026-05-23',
      endDate: '2026-07-06',
      status: ProjectStatus.ACTIVE,
    });
    console.log('Created DevFlow project');
  }

  const existingTasks = await taskRepo.count({ where: { projectId: project.id } });
  if (existingTasks > 0) {
    console.log('Tasks already seeded');
    await dataSource.destroy();
    return;
  }

  const weekTasks: Array<{
    title: string;
    notes: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
  }> = [
    {
      title: 'Initialiser le monorepo et Docker Compose',
      notes: 'docker-compose.yml, .env.example, structure backend/frontend',
      dueDate: '2026-05-23',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
    },
    {
      title: 'Configurer NestJS + TypeORM + PostgreSQL',
      notes: 'Entities, migrations, modules auth/projects/tasks',
      dueDate: '2026-05-24',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DONE,
    },
    {
      title: 'Implémenter JWT (access + refresh)',
      notes: 'Guards, strategies, interceptors Angular',
      dueDate: '2026-05-25',
      priority: TaskPriority.HIGH,
      status: TaskStatus.DOING,
    },
    {
      title: 'CRUD projets et tâches avec progression',
      notes: 'GET /projects avec calcul progression côté backend',
      dueDate: '2026-05-26',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
    },
    {
      title: 'Dashboard et endpoints today/overdue/calendar',
      notes: 'GET /dashboard, filtres tâches',
      dueDate: '2026-05-27',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
    },
    {
      title: 'WebSocket reminders + cron 30s',
      notes: 'NotificationsGateway, tasks.cron, desktop notifications',
      dueDate: '2026-05-28',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
    },
    {
      title: 'UI Angular Material dark theme + calendrier',
      notes: 'Sidebar, cards, autosave notes 500ms debounce',
      dueDate: '2026-05-29',
      priority: TaskPriority.LOW,
      status: TaskStatus.TODO,
    },
  ];

  for (const t of weekTasks) {
    await taskRepo.save({
      projectId: project.id,
      title: t.title,
      notes: t.notes,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      reminderAt: null,
      reminderSent: false,
    });
  }

  console.log(`Seeded ${weekTasks.length} tasks for DevFlow`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
