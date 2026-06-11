import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriveService } from './drive.service';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('drive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('status')
  async getStatus(@Req() req: AuthRequest) {
    return this.driveService.getStatus(req.user.userId);
  }

  @Get('backups')
  async listBackups(@Req() req: AuthRequest) {
    return this.driveService.listBackups(req.user.userId);
  }

  @Post('backup')
  async triggerBackup(@Req() req: AuthRequest) {
    return this.driveService.performBackup(req.user.userId);
  }

  @Post('restore/:fileId')
  async restoreBackup(@Req() req: AuthRequest, @Param('fileId') fileId: string) {
    return this.driveService.restoreFromBackup(req.user.userId, fileId);
  }

  @Get('files/:projectId')
  async listFiles(@Req() req: AuthRequest, @Param('projectId') projectId: string) {
    return this.driveService.listProjectFiles(req.user.userId, projectId);
  }

  @Post('files/:projectId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: AuthRequest,
    @Param('projectId') projectId: string,
    @UploadedFile() file: any, // Express.Multer.File
  ) {
    if (!file) {
      throw new Error('Aucun fichier fourni.');
    }
    return this.driveService.uploadProjectFile(
      req.user.userId,
      projectId,
      file.originalname,
      file.mimetype,
      file.buffer,
    );
  }

  @Get('download/:fileId')
  async downloadFile(
    @Req() req: AuthRequest,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const file = await this.driveService.downloadProjectFile(req.user.userId, fileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.send(file.data);
  }

  @Delete('files/:fileId')
  async deleteFile(@Req() req: AuthRequest, @Param('fileId') fileId: string) {
    return this.driveService.deleteProjectFile(req.user.userId, fileId);
  }
}
