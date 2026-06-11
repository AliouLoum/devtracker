import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.projectsService.findAllForUser(req.user.userId);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Post('demo')
  createDemo(@Req() req: AuthRequest) {
    return this.projectsService.createDemoProject(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.projectsService.findOneForUser(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.projectsService.remove(req.user.userId, id);
  }
}
