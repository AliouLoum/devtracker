import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Get('current')
  getCurrentTimer(@Request() req: any) {
    return this.timeTrackingService.getCurrentTimer(req.user.id);
  }

  @Post('start/:id')
  startTimer(@Request() req: any, @Param('id') taskId: string) {
    return this.timeTrackingService.startTimer(req.user.id, taskId);
  }

  @Post('stop/:id')
  stopTimer(@Request() req: any, @Param('id') taskId: string) {
    return this.timeTrackingService.stopTimer(req.user.id, taskId);
  }
}
