import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '摘星重现', minLength: 1 })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'Flora@2026', minLength: 1 })
  @IsString()
  @MinLength(1)
  password!: string;
}
