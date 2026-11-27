import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '摘星重现', minLength: 1 })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'Flora@2026', minLength: 1 })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiPropertyOptional({ example: '星辰', nullable: true, type: String })
  @IsOptional()
  @IsString()
  nickname?: string | null;
}
