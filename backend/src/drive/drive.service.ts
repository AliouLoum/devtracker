import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectFile } from './entities/project-file.entity';
import { UserSettings } from '../intelligence/entities/user-settings.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Note } from '../notes/entities/note.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private readonly localMockPath = path.join(process.cwd(), 'local_drive_mock');

  constructor(
    @InjectRepository(ProjectFile)
    private readonly projectFilesRepo: Repository<ProjectFile>,
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    // Ensure local mock folders exist
    if (!fs.existsSync(this.localMockPath)) {
      fs.mkdirSync(this.localMockPath, { recursive: true });
    }
    fs.mkdirSync(path.join(this.localMockPath, 'Backups'), { recursive: true });
    fs.mkdirSync(path.join(this.localMockPath, 'Projects'), { recursive: true });
  }

  /**
   * Helper to retrieve Google Auth Client for a specific user
   */
  private async getGoogleDriveClient(userId: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    const settings = await this.settingsRepo.findOne({ where: { userId } });
    const tokens = settings?.googleTokens as any;

    if (!clientId || !clientSecret || !tokens || !tokens.refresh_token) {
      this.logger.warn(`Google OAuth not configured or missing tokens for user=${userId}. Using local mock drive.`);
      return null;
    }

    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      oauth2Client.setCredentials(tokens);
      return google.drive({ version: 'v3', auth: oauth2Client });
    } catch (err: any) {
      this.logger.error(`Error initializing Google OAuth client: ${err.message}. Defaulting to mock.`);
      return null;
    }
  }

  /**
   * Check connection status
   */
  async getStatus(userId: string) {
    const drive = await this.getGoogleDriveClient(userId);
    return {
      connected: drive !== null,
      provider: drive !== null ? 'Google Drive' : 'Local Mock Drive',
    };
  }

  /**
   * Get folder ID or create it in Google Drive
   */
  private async getOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    
    const res = await drive.files.list({ q: query, fields: 'files(id)' });
    const folders = res.data.files;
    
    if (folders && folders.length > 0) {
      return folders[0].id;
    }

    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      metadata.parents = [parentId];
    }

    const folder = await drive.files.create({
      resource: metadata,
      fields: 'id',
    });
    return folder.data.id;
  }

  /**
   * BACKUP: Export all database rows and upload as JSON
   */
  async performBackup(userId: string): Promise<{ backupId: string; filename: string; exportedAt: Date }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const projects = await this.projectsRepo.find({ where: { userId } });
    const tasks = await this.tasksRepo.find({ where: { userId } });
    const notes = await this.notesRepo.find({ where: { userId } });
    const settings = await this.settingsRepo.findOne({ where: { userId } });

    const backupData = {
      version: '1.0',
      exportedAt: new Date(),
      user: { id: user.id, name: user.name, email: user.email },
      projects,
      tasks,
      notes,
      settings: settings ? {
        dailyBriefingTime: settings.dailyBriefingTime,
        dailyBriefingEnabled: settings.dailyBriefingEnabled,
        weeklyReviewEnabled: settings.weeklyReviewEnabled,
        weeklyReviewDay: settings.weeklyReviewDay,
        weeklyReviewTime: settings.weeklyReviewTime,
        timezone: settings.timezone,
        preferences: settings.preferences,
      } : null,
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const drive = await this.getGoogleDriveClient(userId);

    if (drive) {
      try {
        // 1. Get or create root folder "DevTracker"
        const rootId = await this.getOrCreateFolder(drive, 'DevTracker');
        // 2. Get or create "Backups" folder
        const backupsId = await this.getOrCreateFolder(drive, 'Backups', rootId);
        
        // 3. Upload file
        const media = {
          mimeType: 'application/json',
          body: backupJson,
        };
        const fileMetadata = {
          name: filename,
          parents: [backupsId],
        };

        const res = await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id',
        });

        // 4. Perform rotation (keep last 30)
        await this.rotateGoogleDriveBackups(drive, backupsId);

        return {
          backupId: res.data.id || '',
          filename,
          exportedAt: backupData.exportedAt,
        };
      } catch (err: any) {
        this.logger.error(`Failed uploading backup to Google Drive: ${err.message}. Using mock fallback.`);
      }
    }

    // Local Mock Fallback
    const localPath = path.join(this.localMockPath, 'Backups', filename);
    fs.writeFileSync(localPath, backupJson);
    this.rotateLocalBackups();

    return {
      backupId: filename,
      filename,
      exportedAt: backupData.exportedAt,
    };
  }

  /**
   * Rotation in Google Drive (keeps latest 30 backups)
   */
  private async rotateGoogleDriveBackups(drive: any, folderId: string) {
    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/json' and trashed = false`,
        orderBy: 'createdTime desc',
        fields: 'files(id, name)',
      });

      const files = res.data.files;
      if (files && files.length > 30) {
        const extraFiles = files.slice(30);
        for (const file of extraFiles) {
          await drive.files.delete({ fileId: file.id });
          this.logger.log(`Rotated out Google Drive backup: ${file.name}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Backup rotation failed: ${err.message}`);
    }
  }

  /**
   * Rotation in local filesystem mock (keeps latest 30 backups)
   */
  private rotateLocalBackups() {
    const backupDir = path.join(this.localMockPath, 'Backups');
    const files = fs.readdirSync(backupDir)
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      const extra = files.slice(30);
      for (const file of extra) {
        fs.unlinkSync(path.join(backupDir, file.name));
        this.logger.log(`Rotated out local backup: ${file.name}`);
      }
    }
  }

  /**
   * LIST BACKUPS: Fetch list of backups
   */
  async listBackups(userId: string): Promise<Array<{ id: string; name: string; sizeBytes?: number; createdTime: Date }>> {
    const drive = await this.getGoogleDriveClient(userId);

    if (drive) {
      try {
        const rootId = await this.getOrCreateFolder(drive, 'DevTracker');
        const backupsId = await this.getOrCreateFolder(drive, 'Backups', rootId);
        
        const res = await drive.files.list({
          q: `'${backupsId}' in parents and trashed = false`,
          orderBy: 'createdTime desc',
          fields: 'files(id, name, size, createdTime)',
        });

        const files = res.data.files || [];
        return files.map(f => ({
          id: f.id || '',
          name: f.name || '',
          sizeBytes: f.size ? parseInt(f.size, 10) : undefined,
          createdTime: f.createdTime ? new Date(f.createdTime) : new Date(),
        }));
      } catch (err: any) {
        this.logger.error(`Error listing Google Drive backups: ${err.message}. Using mock.`);
      }
    }

    // Local Mock drive
    const backupDir = path.join(this.localMockPath, 'Backups');
    const files = fs.readdirSync(backupDir);
    return files.map(file => {
      const stats = fs.statSync(path.join(backupDir, file));
      return {
        id: file,
        name: file,
        sizeBytes: stats.size,
        createdTime: stats.mtime,
      };
    }).sort((a, b) => b.createdTime.getTime() - a.createdTime.getTime());
  }

  /**
   * RESTORE: Restore entire DB from backup JSON
   */
  async restoreFromBackup(userId: string, backupId: string): Promise<{ success: boolean }> {
    const drive = await this.getGoogleDriveClient(userId);
    let backupJsonStr = '';

    if (drive && !fs.existsSync(path.join(this.localMockPath, 'Backups', backupId))) {
      try {
        const res = await drive.files.get({
          fileId: backupId,
          alt: 'media',
        });
        backupJsonStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      } catch (err: any) {
        this.logger.error(`Failed downloading backup ${backupId} from Drive: ${err.message}`);
        throw new NotFoundException('Could not download backup from Google Drive.');
      }
    } else {
      // Local Mock
      const localPath = path.join(this.localMockPath, 'Backups', backupId);
      if (!fs.existsSync(localPath)) {
        throw new NotFoundException('Backup file not found.');
      }
      backupJsonStr = fs.readFileSync(localPath, 'utf8');
    }

    const data = JSON.parse(backupJsonStr);
    
    // Validate version
    if (!data.version || !data.projects || !data.tasks) {
      throw new Error('Format de sauvegarde invalide.');
    }

    // Run safe Transaction to rewrite DB
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Starting database restoration process for user=${userId}...`);

      // 1. Delete user-owned records
      await queryRunner.query(`DELETE FROM tasks WHERE user_id = $1 OR project_id IN (SELECT id FROM projects WHERE user_id = $1)`, [userId]);
      await queryRunner.query(`DELETE FROM notes WHERE user_id = $1`, [userId]);
      await queryRunner.query(`DELETE FROM projects WHERE user_id = $1`, [userId]);

      // 2. Restore Projects
      for (const p of data.projects) {
        await queryRunner.query(
          `INSERT INTO projects (id, user_id, name, description, color, status, start_date, end_date, hours_per_week, estimated_weeks, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [p.id, userId, p.name, p.description, p.color, p.status, p.startDate, p.endDate, p.hoursPerWeek, p.estimatedWeeks, p.createdAt || new Date()],
        );
      }

      // 3. Restore Tasks
      for (const t of data.tasks) {
        await queryRunner.query(
          `INSERT INTO tasks (id, project_id, user_id, title, notes, due_date, priority, status, estimated_minutes, time_spent_seconds, scheduled_at, is_inbox, reminder_at, reminder_sent, issue_number, github_commit_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [t.id, t.projectId, userId, t.title, t.notes, t.dueDate, t.priority, t.status, t.estimatedMinutes, t.timeSpentSeconds, t.scheduledAt, t.isInbox, t.reminderAt, t.reminderSent, t.issueNumber, t.githubCommitUrl, t.createdAt || new Date()],
        );
      }

      // 4. Restore Notes
      if (data.notes) {
        for (const n of data.notes) {
          await queryRunner.query(
            `INSERT INTO notes (id, user_id, title, content, color, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [n.id, userId, n.title, n.content, n.color || '#fff', n.createdAt || new Date()],
          );
        }
      }

      // 5. Restore Settings
      if (data.settings) {
        const s = data.settings;
        await queryRunner.query(
          `INSERT INTO user_settings (user_id, daily_briefing_time, daily_briefing_enabled, weekly_review_enabled, weekly_review_day, weekly_review_time, timezone, preferences)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id) DO UPDATE SET
             daily_briefing_time = $2, daily_briefing_enabled = $3, weekly_review_enabled = $4,
             weekly_review_day = $5, weekly_review_time = $6, timezone = $7, preferences = $8`,
          [userId, s.dailyBriefingTime, s.dailyBriefingEnabled, s.weeklyReviewEnabled, s.weeklyReviewDay, s.weeklyReviewTime, s.timezone, JSON.stringify(s.preferences)],
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log('Restoration completed successfully.');
      return { success: true };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Restoration failed: ${err.message}`);
      throw new Error(`Database restoration failed: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * PROJECT FILES: Upload Project file
   */
  async uploadProjectFile(
    userId: string,
    projectId: string,
    name: string,
    mimeType: string,
    fileBuffer: Buffer,
  ): Promise<ProjectFile> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');

    const drive = await this.getGoogleDriveClient(userId);
    let driveFileId = `mock-${Date.now()}`;

    if (drive) {
      try {
        const rootId = await this.getOrCreateFolder(drive, 'DevTracker');
        const projectsFolderId = await this.getOrCreateFolder(drive, 'Projects', rootId);
        const specificProjectFolderId = await this.getOrCreateFolder(drive, project.name, projectsFolderId);

        const media = {
          mimeType,
          body: fs.createReadStream(
            this.writeTempFile(name, fileBuffer) // write buffer to a temp file to upload stream
          ),
        };
        const fileMetadata = {
          name,
          parents: [specificProjectFolderId],
        };

        const res = await drive.files.create({
          requestBody: fileMetadata,
          media,
          fields: 'id',
        });
        driveFileId = res.data.id || '';
      } catch (err: any) {
        this.logger.error(`Failed uploading file to Drive: ${err.message}. Storing on mock.`);
      }
    }

    // Mock store on disk
    const projDir = path.join(this.localMockPath, 'Projects', project.name);
    fs.mkdirSync(projDir, { recursive: true });
    fs.writeFileSync(path.join(projDir, name), fileBuffer);

    // Save metadata in Postgres
    const pFile = this.projectFilesRepo.create({
      projectId,
      driveFileId,
      name,
      mimeType,
    });
    return this.projectFilesRepo.save(pFile);
  }

  private writeTempFile(name: string, buffer: Buffer): string {
    const tempDir = path.join(process.cwd(), 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, name);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
  }

  /**
   * PROJECT FILES: List all files for a project
   */
  async listProjectFiles(userId: string, projectId: string): Promise<ProjectFile[]> {
    const project = await this.projectsRepo.findOne({ where: { id: projectId, userId } });
    if (!project) throw new NotFoundException('Project not found');

    return this.projectFilesRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * PROJECT FILES: Download file content
   */
  async downloadProjectFile(userId: string, fileId: string): Promise<{ name: string; mimeType: string; data: Buffer }> {
    const fileMetadata = await this.projectFilesRepo.findOne({ where: { id: fileId } });
    if (!fileMetadata) throw new NotFoundException('File not found in database.');

    const project = await this.projectsRepo.findOne({ where: { id: fileMetadata.projectId, userId } });
    if (!project) throw new NotFoundException('Unauthorized file download.');

    // Attempt Drive
    const drive = await this.getGoogleDriveClient(userId);
    if (drive && !fileMetadata.driveFileId.startsWith('mock-')) {
      try {
        const response = await drive.files.get({
          fileId: fileMetadata.driveFileId,
          alt: 'media',
        }, { responseType: 'arraybuffer' });
        
        return {
          name: fileMetadata.name,
          mimeType: fileMetadata.mimeType || 'application/octet-stream',
          data: Buffer.from(response.data as ArrayBuffer),
        };
      } catch (err: any) {
        this.logger.error(`Error downloading from Drive: ${err.message}. Attempting mock disk read.`);
      }
    }

    // Mock disk read
    const localPath = path.join(this.localMockPath, 'Projects', project.name, fileMetadata.name);
    if (!fs.existsSync(localPath)) {
      throw new NotFoundException('File not found in local mock drive.');
    }

    return {
      name: fileMetadata.name,
      mimeType: fileMetadata.mimeType || 'application/octet-stream',
      data: fs.readFileSync(localPath),
    };
  }

  /**
   * PROJECT FILES: Delete file
   */
  async deleteProjectFile(userId: string, fileId: string): Promise<{ success: boolean }> {
    const fileMetadata = await this.projectFilesRepo.findOne({ where: { id: fileId } });
    if (!fileMetadata) throw new NotFoundException('File not found');

    const project = await this.projectsRepo.findOne({ where: { id: fileMetadata.projectId, userId } });
    if (!project) throw new NotFoundException('Unauthorized file delete.');

    // Delete Drive file
    const drive = await this.getGoogleDriveClient(userId);
    if (drive && !fileMetadata.driveFileId.startsWith('mock-')) {
      try {
        await drive.files.delete({ fileId: fileMetadata.driveFileId });
      } catch (err: any) {
        this.logger.error(`Failed deleting file from Drive: ${err.message}`);
      }
    }

    // Delete Mock file
    const localPath = path.join(this.localMockPath, 'Projects', project.name, fileMetadata.name);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    // Remove from DB
    await this.projectFilesRepo.remove(fileMetadata);
    return { success: true };
  }
}
