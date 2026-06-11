import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserSettings } from '../intelligence/entities/user-settings.entity';
import { AiModule } from '../ai/ai.module';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, UserSettings]),
    ConfigModule,
    AiModule,
  ],
  controllers: [GithubController],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
