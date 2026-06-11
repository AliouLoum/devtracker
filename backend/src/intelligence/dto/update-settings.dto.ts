import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsObject, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  dailyBriefingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dailyBriefingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyReviewEnabled?: boolean;

  @ApiPropertyOptional({ description: '0=Sunday' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weeklyReviewDay?: number;

  @ApiPropertyOptional({ example: '19:00' })
  @IsOptional()
  @IsString()
  weeklyReviewTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  googleTokens?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  githubToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  githubUsername?: string;
}
