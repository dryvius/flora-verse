import { ApiProperty } from '@nestjs/swagger';

export class HealthChecksDto {
  @ApiProperty({ enum: ['up'], example: 'up' })
  database!: 'up';
}

export class HealthCheckDataDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;

  @ApiProperty({ example: '2026-11-26T02:00:00.000Z' })
  timestamp!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'OK' })
  code!: 'OK';

  @ApiProperty({ example: 'success' })
  message!: string;

  @ApiProperty({ type: HealthCheckDataDto })
  data!: HealthCheckDataDto;

  @ApiProperty({ example: 'req_018f2c5e-7b1a-7c2d-8e3f-123456789abc' })
  requestId!: string;
}

export class HealthUnavailableResponseDto {
  @ApiProperty({ example: 'DATABASE_UNAVAILABLE' })
  code!: string;

  @ApiProperty({ example: 'Database is unavailable' })
  message!: string;

  @ApiProperty({ example: 'req_018f2c5e-7b1a-7c2d-8e3f-123456789abc' })
  requestId!: string;
}
