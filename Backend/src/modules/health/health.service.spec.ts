import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  beforeEach(() => {
    Logger.overrideLogger(false);
  });

  it('returns ok when the database responds', async () => {
    const prisma = {
      ping: vi.fn().mockResolvedValue(undefined),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('up');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('throws a public unavailable error when the database ping fails', async () => {
    const prisma = {
      ping: vi
        .fn()
        .mockRejectedValue(
          new Error('mysql://app:super-secret@localhost:3306/floraverse'),
        ),
    };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    try {
      await service.check();
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      if (!(error instanceof ServiceUnavailableException)) {
        return;
      }
      expect(JSON.stringify(error.getResponse())).not.toContain('super-secret');
      expect(error.getResponse()).toMatchObject({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is unavailable',
      });
    }
  });
});
