import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password, required unless logged in via Google without a password' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ description: 'New password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
