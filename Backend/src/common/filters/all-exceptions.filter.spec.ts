import { type ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeEach(() => {
    Logger.overrideLogger(false);
  });

  it('hides unexpected error details', () => {
    const json = vi.fn();
    const setHeader = vi.fn();
    const host = createHost({
      json,
      setHeader,
      requestId: 'req_test',
    });

    filter.catch(
      new Error('mysql://app:super-secret@localhost:3306/floraverse'),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId: 'req_test',
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('super-secret');
  });

  it('maps http exceptions to the public error contract', () => {
    const json = vi.fn();
    const host = createHost({
      json,
      setHeader: vi.fn(),
      requestId: 'req_missing',
    });

    filter.catch(
      new HttpException(
        { message: 'Cannot GET /api/v1/missing', code: undefined },
        404,
      ),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_FOUND',
        requestId: 'req_missing',
      }),
    );
  });
});

function createHost(options: {
  json: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  requestId?: string;
}): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        id: options.requestId,
        method: 'GET',
        originalUrl: '/api/v1/health',
      }),
      getResponse: () => ({
        setHeader: options.setHeader,
        status: (statusCode: number) => {
          expect(statusCode).toBeGreaterThanOrEqual(400);
          return { json: options.json };
        },
      }),
    }),
  } as ArgumentsHost;
}
