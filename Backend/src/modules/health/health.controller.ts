import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthResponseDto,
  HealthUnavailableResponseDto,
} from './dto/health-response.dto.js';
import { HealthService } from './health.service.js';
import type { HealthCheckData } from './health.types.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '检查 API 与数据库是否可用' })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthUnavailableResponseDto })
  check(): Promise<HealthCheckData> {
    return this.healthService.check();
  }
}
