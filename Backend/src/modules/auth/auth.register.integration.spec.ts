import { ConflictException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request, { type Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AuthProvider } from '../../generated/prisma/enums.js';
import { AppModule } from '../../app.module.js';
import { configureHttpApp } from '../../configure-app.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AuthService } from './auth.service.js';

const PASSWORD = 'Flora@2026';

const successSchema = z.object({
  code: z.literal('OK'),
  message: z.string(),
  requestId: z.string(),
  data: z.object({
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

const conflictSchema = z.object({
  code: z.literal('USERNAME_ALREADY_EXISTS'),
  message: z.literal('用户名已存在'),
  requestId: z.string(),
});

function readJson(response: Response): unknown {
  return JSON.parse(response.text) as unknown;
}

function testUsername(): string {
  return `It${randomBytes(4).toString('hex')}`;
}

describe('register against MySQL', () => {
  let app: NestExpressApplication;
  let service: AuthService;
  let prisma: PrismaService;
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
    service = app.get(AuthService);
    prisma = app.get(PrismaService);
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

  it('creates a linked user and password identity', async () => {
    const username = testUsername();
    subjects.push(username);
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD, nickname: '星辰' });

    expect(response.status).toBe(201);
    const body = successSchema.parse(readJson(response));
    expect(body.data.username).toBe(username);
    expect(body.data.user.nickname).toBe('星辰');
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    createdUserIds.push(body.data.user.id);

    const identity = await prisma.authIdentity.findFirst({
      where: { userId: body.data.user.id, provider: AuthProvider.PASSWORD },
    });
    expect(identity?.providerSubject).toBe(username);
    expect(identity?.unionId).toBeNull();
    expect(identity?.passwordHash?.startsWith('$argon2id$')).toBe(true);
    expect(identity?.passwordHash).not.toContain(PASSWORD);

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD, nickname: '另一昵称' });
    expect(duplicate.status).toBe(409);
    expect(conflictSchema.parse(readJson(duplicate))).toMatchObject({
      code: 'USERNAME_ALREADY_EXISTS',
      message: '用户名已存在',
    });
    const nicknames = await prisma.user.findMany({
      where: { nickname: '另一昵称' },
    });
    expect(nicknames).toHaveLength(0);
  }, 30_000);

  it('treats case and canonical equivalents as the same username', async () => {
    const lower = testUsername();
    const upper = lower.toUpperCase();
    subjects.push(lower, upper);
    const first = await service.register({
      username: lower,
      password: PASSWORD,
    });
    createdUserIds.push(first.user.id);
    await expect(
      service.register({ username: upper, password: PASSWORD }),
    ).rejects.toBeInstanceOf(ConflictException);

    const nfc = `${testUsername()}é`;
    const nfd = nfc.normalize('NFD');
    subjects.push(nfc, nfd.normalize('NFC'));
    const canonical = await service.register({
      username: nfd,
      password: PASSWORD,
    });
    createdUserIds.push(canonical.user.id);
    expect(canonical.username).toBe(nfc);
    await expect(
      service.register({ username: nfc, password: PASSWORD }),
    ).rejects.toBeInstanceOf(ConflictException);
    const stored = await prisma.authIdentity.findFirst({
      where: { userId: canonical.user.id },
    });
    expect(stored?.providerSubject).toBe(nfc);
  }, 30_000);

  it('allows only one of two concurrent registrations', async () => {
    const username = testUsername();
    subjects.push(username);
    const results = await Promise.allSettled([
      service.register({ username, password: PASSWORD }),
      service.register({ username, password: PASSWORD }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    if (fulfilled[0]?.status !== 'fulfilled' || rejected[0]?.status !== 'rejected') {
      throw new Error('Expected one success and one rejection');
    }
    expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    createdUserIds.push(fulfilled[0].value.user.id);
    const identities = await prisma.authIdentity.count({
      where: {
        provider: AuthProvider.PASSWORD,
        providerSubject: username,
      },
    });
    expect(identities).toBe(1);
  }, 30_000);
});
