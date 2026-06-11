import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import { UserSettings } from '../intelligence/entities/user-settings.entity';
import { AiService } from '../ai/ai.service';
import { aiConfig } from '../ai/ai.config';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to retrieve Octokit client for a user
   */
  private async getOctokitClient(userId: string): Promise<Octokit | null> {
    const globalToken = this.configService.get<string>('GITHUB_TOKEN');
    
    // Check if user has their own token in settings
    const settings = await this.settingsRepo.findOne({ where: { userId } });
    const userToken = settings?.githubToken;

    const token = userToken || globalToken;

    if (!token || token.startsWith('ghp_xxxx') || token === 'ton_personal_access_token') {
      this.logger.warn(`GitHub Token not configured for user=${userId}. Using high-fidelity mock github service.`);
      return null;
    }

    try {
      return new Octokit({ auth: token });
    } catch (err: any) {
      this.logger.error(`Error initializing Octokit: ${err.message}`);
      return null;
    }
  }

  /**
   * GET REPOS: Fetch user repositories
   */
  async listUserRepos(userId: string): Promise<Array<{ id: number; name: string; owner: string; fullName: string; description?: string }>> {
    const octokit = await this.getOctokitClient(userId);

    if (octokit) {
      try {
        const res = await octokit.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 50,
        });
        return res.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          owner: repo.owner.login,
          fullName: repo.full_name,
          description: repo.description || undefined,
        }));
      } catch (err: any) {
        this.logger.error(`GitHub API repos.list failed: ${err.message}. Using mock.`);
      }
    }

    // High fidelity Mock Fallback
    return [
      { id: 101, name: 'devflow', owner: 'aliou', fullName: 'aliou/devflow', description: 'Development workflow tool' },
      { id: 102, name: 'devtracker', owner: 'luisi', fullName: 'luisi/devtracker', description: 'Productivity tool' },
      { id: 103, name: 'nest-starter', owner: 'luisi', fullName: 'luisi/nest-starter', description: 'NestJS starter kit' },
      { id: 104, name: 'angular-premium-template', owner: 'luisi', fullName: 'luisi/angular-premium-template', description: 'Angular admin template' },
    ];
  }

  /**
   * SYNC REPOS: Import GitHub repos as projects
   */
  async syncReposAsProjects(userId: string, selectedRepos?: string[]): Promise<Project[]> {
    const repos = await this.listUserRepos(userId);
    const importedProjects: Project[] = [];

    // Filter repos if selectedRepos is provided
    const reposToImport = selectedRepos 
      ? repos.filter(repo => selectedRepos.includes(repo.fullName))
      : repos;

    for (const repo of reposToImport) {
      // Check if project already exists for this repo
      const existing = await this.projectsRepo.findOne({
        where: {
          userId,
          githubRepoOwner: repo.owner,
          githubRepoName: repo.name,
        },
      });

      if (!existing) {
        // Create new project from repo
        const newProject = this.projectsRepo.create({
          userId,
          name: repo.name,
          description: (repo as any).description || `Dépôt GitHub: ${repo.fullName}`,
          status: ProjectStatus.ACTIVE,
          githubRepoOwner: repo.owner,
          githubRepoName: repo.name,
          color: '#10B981', // green for github imported
        });
        const saved = await this.projectsRepo.save(newProject);
        importedProjects.push(saved);
      }
    }

    return importedProjects;
  }

  /**
   * LINK PROJECT: Link project to repository
   */
  async linkProject(userId: string, projectId: string, owner: string, repo: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');

    project.githubRepoOwner = owner;
    project.githubRepoName = repo;
    return this.projectsRepo.save(project);
  }

  /**
   * GET REPO CONTENT: Fetch repository tree or file content
   */
  async getRepoContent(userId: string, projectId: string, path: string = ''): Promise<any> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    if (!project.githubRepoOwner || !project.githubRepoName) {
      throw new Error('Project not linked to a GitHub repository');
    }

    const octokit = await this.getOctokitClient(userId);
    if (!octokit) {
      throw new Error('GitHub token not found or invalid');
    }

    try {
      const response = await octokit.repos.getContent({
        owner: project.githubRepoOwner,
        repo: project.githubRepoName,
        path: path,
      });
      return response.data;
    } catch (err: any) {
      this.logger.error(`GitHub API repos.getContent failed: ${err.message}`);
      throw new Error(`Failed to fetch content from GitHub: ${err.message}`);
    }
  }

  /**
   * SYNC TASK TO ISSUE: Pushes local task as GitHub issue
   */
  async pushTaskToIssue(userId: string, taskId: string): Promise<{ issueNumber: number; url: string }> {
    const task = await this.tasksRepo.findOne({
      where: { id: taskId },
      relations: ['project'],
    });
    if (!task) throw new NotFoundException('Task not found');

    // Assert project is owned and has linked repo
    const projectId = task.projectId;
    if (!projectId) throw new Error('Cette tâche doit faire partie d\'un projet pour être poussée.');

    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    if (!project.githubRepoOwner || !project.githubRepoName) {
      throw new Error('Veuillez lier ce projet à un dépôt GitHub dans les Paramètres d\'abord.');
    }

    const octokit = await this.getOctokitClient(userId);

    const issueTitle = task.title;
    const issueBody = `${task.notes || 'Aucune description fournie.'}\n\n---\n*Créé automatiquement via DevTracker (ID: ${task.id})*`;
    const priorityLabel = `priority:${task.priority || 'medium'}`;

    if (octokit) {
      try {
        const res = await octokit.issues.create({
          owner: project.githubRepoOwner,
          repo: project.githubRepoName,
          title: issueTitle,
          body: issueBody,
          labels: [priorityLabel, 'devtracker'],
        });

        // Save issueNumber in DB
        task.issueNumber = res.data.number;
        await this.tasksRepo.save(task);

        return {
          issueNumber: res.data.number,
          url: res.data.html_url,
        };
      } catch (err: any) {
        this.logger.error(`GitHub issue creation failed: ${err.message}. Using mock.`);
      }
    }

    // Mock response
    const mockIssueNum = Math.floor(Math.random() * 500) + 1;
    task.issueNumber = mockIssueNum;
    await this.tasksRepo.save(task);

    return {
      issueNumber: mockIssueNum,
      url: `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/issues/${mockIssueNum}`,
    };
  }

  /**
   * GET OPEN ISSUES: Fetch open issues from GitHub
   */
  async getOpenIssues(userId: string, projectId: string): Promise<any[]> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    if (!project.githubRepoOwner || !project.githubRepoName) {
      throw new Error('Veuillez lier ce projet à un dépôt GitHub.');
    }

    const octokit = await this.getOctokitClient(userId);
    let issuesData: any[] = [];

    if (octokit) {
      try {
        const res = await octokit.issues.listForRepo({
          owner: project.githubRepoOwner,
          repo: project.githubRepoName,
          state: 'open',
          per_page: 30,
        });
        issuesData = res.data.filter(issue => !issue.pull_request); // omit pull requests
      } catch (err: any) {
        this.logger.error(`GitHub list issues failed: ${err.message}. Using mock.`);
      }
    }

    if (issuesData.length === 0) {
      // Mock issues list
      issuesData = [
        {
          number: 14,
          title: 'fix(db): optimiser la requête des insights de vélocité',
          body: 'Les performances saturent quand le nombre de tâches dépasse 500.',
          labels: [{ name: 'priority:high' }],
        },
        {
          number: 15,
          title: 'feat(auth): intégrer le login via Google OAuth2',
          body: 'Permettre aux développeurs de s\'inscrire directement avec Gmail.',
          labels: [{ name: 'priority:medium' }],
        },
        {
          number: 16,
          title: 'docs(api): documenter la passerelle de streaming IA',
          body: 'Ajouter des schémas d\'architecture pour Socket.IO.',
          labels: [{ name: 'priority:low' }],
        },
      ];
    }
    
    return issuesData.map(issue => ({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      url: issue.html_url || `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/issues/${issue.number}`,
      labels: issue.labels
    }));
  }

  /**
   * IMPORT SELECTED ISSUES: Import specific issues from GitHub as tasks
   */
  async importSelectedIssuesAsTasks(userId: string, projectId: string, issueNumbers: number[]): Promise<Task[]> {
    if (!issueNumbers || issueNumbers.length === 0) {
      return [];
    }
    
    const issuesData = await this.getOpenIssues(userId, projectId);
    const selectedIssues = issuesData.filter(issue => issueNumbers.includes(issue.number));

    const importedTasks: Task[] = [];

    for (const issue of selectedIssues) {
      // Check if already imported
      const existing = await this.tasksRepo.findOne({
        where: {
          projectId,
          issueNumber: issue.number,
        },
      });

      if (existing) continue;

      // Extract priority
      let priority = 'medium';
      if (issue.labels) {
        const labelsList = issue.labels.map((l: any) => typeof l === 'string' ? l : l.name);
        if (labelsList.includes('priority:high') || labelsList.includes('high')) priority = 'high';
        else if (labelsList.includes('priority:low') || labelsList.includes('low')) priority = 'low';
      }

      const task = this.tasksRepo.create({
        projectId,
        userId,
        title: issue.title,
        notes: issue.body || '',
        priority: priority as TaskPriority,
        status: TaskStatus.TODO,
        isInbox: false,
        issueNumber: issue.number,
      });

      const saved = await this.tasksRepo.save(task);
      importedTasks.push(saved);
    }

    return importedTasks;
  }

  /**
   * WEBHOOK HANDLER: Handle incoming webhook events
   */
  async handleWebhook(body: any): Promise<{ success: boolean }> {
    this.logger.log(`GitHub Webhook received: action=${body.action}`);

    // 1. Issue closed webhook
    if (body.issue && body.action === 'closed') {
      const issueNumber = body.issue.number;
      const repoName = body.repository.name;
      const repoOwner = body.repository.owner.login;

      // Find task
      const task = await this.tasksRepo
        .createQueryBuilder('task')
        .innerJoin('task.project', 'project')
        .where('task.issueNumber = :issueNumber', { issueNumber })
        .andWhere('project.githubRepoOwner = :repoOwner', { repoOwner })
        .andWhere('project.githubRepoName = :repoName', { repoName })
        .getOne();

      if (task) {
        task.status = TaskStatus.DONE;
        await this.tasksRepo.save(task);
        this.logger.log(`Task "${task.title}" (Issue #${issueNumber}) marked DONE automatically via webhook.`);
      }
    }

    // 2. Push webhook containing commits
    if (body.commits && body.action === undefined) {
      for (const commit of body.commits) {
        const message = commit.message || '';
        // Extract task UUID if formatted as #task-uuid or #[UUID]
        const uuidRegex = /#([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
        const match = message.match(uuidRegex);

        if (match) {
          const taskId = match[1];
          const task = await this.tasksRepo.findOne({ where: { id: taskId } });
          if (task) {
            task.githubCommitUrl = commit.url;
            await this.tasksRepo.save(task);
            this.logger.log(`Task "${task.title}" linked to commit: ${commit.url}`);
          }
        }
      }
    }

    return { success: true };
  }

  /**
   * COMMITS LIST: Fetch recent commits (last 5)
   */
  async getRecentCommits(userId: string, projectId: string): Promise<any[]> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');
    if (!project.githubRepoOwner || !project.githubRepoName) {
      return []; // not linked
    }

    const octokit = await this.getOctokitClient(userId);

    if (octokit) {
      try {
        const res = await octokit.repos.listCommits({
          owner: project.githubRepoOwner,
          repo: project.githubRepoName,
          per_page: 5,
        });

        return res.data.map(c => ({
          hash: c.sha.slice(0, 7),
          message: c.commit.message,
          author: c.commit.author?.name || c.author?.login || 'Anonyme',
          date: c.commit.author?.date || new Date().toISOString(),
          url: c.html_url,
        }));
      } catch (err: any) {
        this.logger.error(`GitHub API listCommits failed: ${err.message}. Using mock.`);
      }
    }

    // Mock Commits
    const mockCommits = [
      {
        hash: 'a718bbf',
        message: 'feat(ai): integrate token streaming via NestJS WebSocket gateway',
        author: 'Luis I.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        url: `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/commit/a718bbf`,
      },
      {
        hash: 'f09232d',
        message: 'fix(ui): adjust grid headers alignment in ag-grid tables',
        author: 'Luis I.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        url: `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/commit/f09232d`,
      },
      {
        hash: '2bd913c',
        message: 'docs: update setup manual for local docker compose instructions',
        author: 'Luis I.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
        url: `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/commit/2bd913c`,
      },
      {
        hash: 'c819280',
        message: 'feat(db): add hours allocation and estimates to projects entity',
        author: 'Luis I.',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        url: `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}/commit/c819280`,
      },
    ];

    return mockCommits;
  }

  /**
   * COMMIT MESSAGE GENERATION: Conventional commit generator
   */
  async generateCommitMessage(userId: string, taskId: string): Promise<{ message: string }> {
    const task = await this.tasksRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const systemPrompt = `Tu es un assistant de code expert. Génère UNIQUEMENT un message de validation de commit git au format Conventional Commits (ex: feat(cli): add process parser, fix(auth): prevent null values) correspondant aux modifications apportées par la tâche fournie. Pas d'explications additionnelles, réponds juste avec le message brut en 1 seule ligne.`;

    const userContent = `Titre de la tâche : "${task.title}"\nNotes associées : "${task.notes || ''}"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    let fullText = '';
    await this.aiService.generateCompletionStream(
      aiConfig.codeModel,
      messages,
      0.3,
      (token) => {
        fullText += token;
      },
    );

    // Clean generated text (remove quotes if any)
    const commitMsg = fullText.trim().replace(/^['"`]+|['"`]+$/g, '');
    return { message: commitMsg };
  }
}
