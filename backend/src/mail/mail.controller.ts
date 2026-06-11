import { Controller, Post, UseGuards } from '@nestjs/common';
import { DailyReportCron } from './daily-report.cron';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('mail')
export class MailController {
  constructor(private readonly dailyReportCron: DailyReportCron) {}

  @Post('test-daily')
  async testDailyReport() {
    await this.dailyReportCron.handleDailyReport();
    return { success: true, message: 'Daily report triggered manually' };
  }
}
