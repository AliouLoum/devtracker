import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class FocusCompleteDto {
  @ApiProperty()
  @IsUUID()
  taskId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @ApiPropertyOptional({ enum: ['work', 'break'] })
  @IsOptional()
  @IsString()
  sessionType?: 'work' | 'break';
}

export class InboxCaptureDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;
}

export class AssignInboxDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class ScheduleTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledAt?: string | null;
}
