import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepo: Repository<UserSettings>,
  ) {}

  async getOrCreate(userId: string): Promise<UserSettings> {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.settingsRepo.save({ userId });
    }
    return settings;
  }

  async update(userId: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    const settings = await this.getOrCreate(userId);
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  async findAllEnabledBriefings(): Promise<UserSettings[]> {
    return this.settingsRepo.find({ where: { dailyBriefingEnabled: true } });
  }

  async findAllEnabledWeeklyReviews(): Promise<UserSettings[]> {
    return this.settingsRepo.find({ where: { weeklyReviewEnabled: true } });
  }
}
