import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class SeedRunnerService implements OnModuleInit {
  private readonly logger = new Logger(SeedRunnerService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const runSeed = this.configService.get<string>('RUN_SEED', 'false');
    if (runSeed !== 'true') {
      return;
    }
    try {
      this.logger.log('Running database seed...');
      await execAsync('npm run seed', {
        cwd: process.cwd(),
        env: process.env,
      });
      this.logger.log('Seed completed');
    } catch (error) {
      this.logger.warn('Seed failed or skipped', error);
    }
  }
}
