import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'Cannot GET /api/v1/missing' })
  message!: string;

  @ApiPropertyOptional({ type: Object })
  details?: unknown;

  @ApiProperty({ example: 'req_018f2c5e-7b1a-7c2d-8e3f-123456789abc' })
  requestId!: string;
}
