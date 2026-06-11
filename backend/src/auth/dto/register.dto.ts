import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'demo@devtracker.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Demo User' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
