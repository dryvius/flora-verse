import { Test, type TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request, { type Response } from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module.js';
import { configureHttpApp } from '../src/configure-app.js';

const healthBodySchema = z.object({
  code: z.literal('OK'),
  message: z.string(),
  requestId: z.string(),
  data: z.object({
    status: z.literal('ok'),
    checks: z.object({ database: z.literal('up') }),
    timestamp: z.string(),
  }),
});

const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  stack: z.unknown().optional(),
});

function readJson(response: Response): unknown {
  return JSON.parse(response.text) as unknown;
}

describe('Health (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureHttpApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health reports the database as up', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    const body = healthBodySchema.parse(readJson(response));

    expect(body.message).toBe('success');
    expect(response.headers['x-request-id']).toBe(body.requestId);
  });

  it('echoes a safe client request id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'req_client-01')
      .expect(200);
    const body = healthBodySchema.parse(readJson(response));

    expect(body.requestId).toBe('req_client-01');
  });

  it('returns a public error envelope for unknown routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/missing')
      .expect(404);
    const body = errorBodySchema.parse(readJson(response));

    expect(body.code).toBe('NOT_FOUND');
    expect(body.stack).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('mysql://');
  });
});
