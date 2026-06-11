import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { AiController } from './ai.controller';
import { AiGateway } from './ai.gateway';
import { AiService } from './ai.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    ProjectsModule,
    TasksModule,
    UsersModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiGateway],
  exports: [AiService, AiGateway],
})
export class AiModule {}
