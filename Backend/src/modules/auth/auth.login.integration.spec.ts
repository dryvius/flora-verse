import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request, { type Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { EnvConfig } from '../../common/config/env.schema.js';
import { AuthProvider, UserStatus } from '../../generated/prisma/enums.js';
import { AppModule } from '../../app.module.js';
import { configureHttpApp } from '../../configure-app.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

const PASSWORD = 'Flora@2026';

const loginSuccessSchema = z.object({
  code: z.literal('OK'),
  message: z.string(),
  requestId: z.string(),
  data: z.object({
    accessToken: z.string().min(1),
    tokenType: z.literal('Bearer'),
    expiresIn: z.literal(900),
    username: z.string(),
    user: z.object({
      id: z.string(),
      nickname: z.string().nullable(),
      avatarAssetId: z.string().nullable(),
      status: z.literal('ACTIVE'),
      createdAt: z.string(),
    }),
  }),
});

const credentialsSchema = z.object({
  code: z.literal('INVALID_CREDENTIALS'),
  message: z.literal('Invalid credentials'),
  requestId: z.string(),
});

const inactiveSchema = z.object({
  code: z.literal('USER_NOT_ACTIVE'),
  message: z.literal('User is not active'),
  requestId: z.string(),
});

interface JwtTimeClaims {
  sub: string;
  iat: number;
  exp: number;
}

function readJson(response: Response): unknown {
  return JSON.parse(response.text) as unknown;
}

function testUsername(): string {
  return `It${randomBytes(4).toString('hex')}`;
}

describe('login against MySQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let accessSecret = '';
  let wechatIdentities = 0;
  const subjects: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureHttpApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    accessSecret = app
      .get(ConfigService<EnvConfig, true>)
      .get('JWT_ACCESS_SECRET', { infer: true });
    wechatIdentities = await prisma.authIdentity.count({
      where: { provider: AuthProvider.WECHAT_MINI_PROGRAM },
    });
  }, 30_000);

  afterAll(async () => {
    const identities = await prisma.authIdentity.findMany({
      where: {
        provider: AuthProvider.PASSWORD,
        providerSubject: { in: subjects },
      },
      select: { userId: true },
    });
    const userIds = [
      ...new Set([
        ...createdUserIds,
        ...identities.map((identity) => identity.userId),
      ]),
    ];
    if (userIds.length > 0) {
      await prisma.authIdentity.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    const wechatAfter = await prisma.authIdentity.count({
      where: { provider: AuthProvider.WECHAT_MINI_PROGRAM },
    });
    expect(wechatAfter).toBe(wechatIdentities);
    const demo = await prisma.user.findUnique({ where: { id: 'usr_demo_001' } });
    expect(demo?.nickname).toBe('摘星重现');
    await app.close();
  }, 30_000);

  it('logs in after registration and returns a verifiable access token', async () => {
    const username = testUsername();
    subjects.push(username);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD, nickname: '星辰' });
    expect(registered.status).toBe(201);
    const registeredBody = z
      .object({ data: z.object({ user: z.object({ id: z.string() }) }) })
      .parse(readJson(registered));
    createdUserIds.push(registeredBody.data.user.id);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password: PASSWORD });

    expect(response.status).toBe(200);
    const body = loginSuccessSchema.parse(readJson(response));
    expect(body.data.username).toBe(username);
    expect(body.data.user.id).toBe(registeredBody.data.user.id);
    expect(body.data.user.nickname).toBe('星辰');
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expectAccessToken(body.data.accessToken, body.data.user.id);
    app.get(JwtService).verify(body.data.accessToken);
  }, 30_000);

  it('rejects a wrong password and an unknown username with the same error', async () => {
    const username = testUsername();
    subjects.push(username);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD });
    expect(registered.status).toBe(201);
    createdUserIds.push(readUserId(registered));

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password: 'Other@2026' });
    const unknownUser = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: testUsername(), password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(credentialsSchema.parse(readJson(wrongPassword)).code).toBe(
      credentialsSchema.parse(readJson(unknownUser)).code,
    );
    expect(JSON.stringify(readJson(wrongPassword))).not.toContain(PASSWORD);
  }, 30_000);

  it('logs in with a Chinese username', async () => {
    const username = `苔${randomBytes(3).toString('hex')}`;
    subjects.push(username);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD });
    expect(registered.status).toBe(201);
    createdUserIds.push(readUserId(registered));

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password: PASSWORD });

    expect(response.status).toBe(200);
    const body = loginSuccessSchema.parse(readJson(response));
    expect(body.data.username).toBe(username);
    expectAccessToken(body.data.accessToken, body.data.user.id);
  }, 30_000);

  it('accepts a different latin case for the same stored username', async () => {
    const lower = testUsername();
    const upper = lower.toUpperCase();
    subjects.push(lower, upper);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username: lower, password: PASSWORD });
    expect(registered.status).toBe(201);
    const userId = readUserId(registered);
    createdUserIds.push(userId);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: upper, password: PASSWORD });

    expect(response.status).toBe(200);
    const body = loginSuccessSchema.parse(readJson(response));
    expect(body.data.user.id).toBe(userId);
    expect(body.data.username).toBe(upper);
    expectAccessToken(body.data.accessToken, userId);
  }, 30_000);

  it('rejects a user who is no longer active', async () => {
    const username = testUsername();
    subjects.push(username);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD });
    expect(registered.status).toBe(201);
    const userId = readUserId(registered);
    createdUserIds.push(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DISABLED },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password: PASSWORD });

    expect(response.status).toBe(403);
    inactiveSchema.parse(readJson(response));
    expect(JSON.stringify(readJson(response))).not.toContain('passwordHash');
  }, 30_000);

  function expectAccessToken(token: string, userId: string): void {
    const claims = readJwtClaims(token);
    expect(() => {
      new JwtService().verify(token, { secret: accessSecret });
    }).not.toThrow();
    expect(claims.sub).toBe(userId);
    expect(claims.exp - claims.iat).toBe(900);
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'sub']);
  }
});

function readUserId(response: Response): string {
  const body = z
    .object({ data: z.object({ user: z.object({ id: z.string() }) }) })
    .parse(readJson(response));
  return body.data.user.id;
}

function readJwtClaims(token: string): JwtTimeClaims {
  const segment = token.split('.')[1];
  if (segment === undefined || segment.length === 0) {
    throw new Error('JWT payload is missing');
  }
  const parsed: unknown = JSON.parse(
    Buffer.from(segment, 'base64url').toString('utf8'),
  ) as unknown;
  if (!isJwtTimeClaims(parsed)) {
    throw new Error('JWT payload is invalid');
  }
  return parsed;
}

function isJwtTimeClaims(value: unknown): value is JwtTimeClaims {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record: Record<string, unknown> = value as Record<string, unknown>;
  return (
    typeof record.sub === 'string' &&
    typeof record.iat === 'number' &&
    typeof record.exp === 'number' &&
    Object.keys(record).every(
      (key) => key === 'sub' || key === 'iat' || key === 'exp',
    )
  );
}
