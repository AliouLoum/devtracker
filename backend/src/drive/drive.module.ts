import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProjectFile } from './entities/project-file.entity';
import { UserSettings } from '../intelligence/entities/user-settings.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Note } from '../notes/entities/note.entity';
import { User } from '../users/entities/user.entity';
import { DriveService } from './drive.service';
import { DriveController } from './drive.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectFile, UserSettings, Project, Task, Note, User]),
    ConfigModule,
  ],
  controllers: [DriveController],
  providers: [DriveService],
  exports: [DriveService],
})
export class DriveModule {}
