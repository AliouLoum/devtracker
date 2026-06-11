import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class ScheduleDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(0.5)
  @Max(16)
  availableHours!: number;
}
