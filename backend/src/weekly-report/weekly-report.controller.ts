import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { WeeklyReportService } from './weekly-report.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Controller('weekly-report')
@UseGuards(JwtAuthGuard)
export class WeeklyReportController {
  constructor(
    private readonly weeklyReportService: WeeklyReportService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  @Post('test-send')
  async testSend(@Request() req: any) {
    const user = await this.userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    try {
      await this.weeklyReportService.generateAndSendReport(user);
      return { success: true, message: 'Weekly report sent to your email (MailHog)' };
    } catch (error: any) {
      console.error('ERROR in testSend:', error);
      return { success: false, message: 'Failed to generate report', error: error?.message || String(error) };
    }
  }
}
