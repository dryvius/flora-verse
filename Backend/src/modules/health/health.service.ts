import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type { HealthCheckData } from './health.types.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckData> {
    try {
      await this.prisma.ping();
    } catch (error: unknown) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Database health check failed: ${errorName}`);
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is unavailable',
      });
    }

    return {
      status: 'ok',
      checks: { database: 'up' },
      timestamp: new Date().toISOString(),
    };
  }
}
