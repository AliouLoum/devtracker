import { Controller, Get, Req, UseGuards, Query, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: AuthRequest) {
    return this.dashboardService.getDashboard(req.user.userId);
  }

  @Get('heatmap')
  getHeatmap(@Req() req: AuthRequest, @Query('year') year: string) {
    return this.dashboardService.getHeatmap(req.user.userId, parseInt(year) || new Date().getFullYear());
  }

  @Get('heatmap/day/:date')
  getHeatmapDay(@Req() req: AuthRequest, @Param('date') date: string) {
    return this.dashboardService.getHeatmapDay(req.user.userId, date);
  }
}
