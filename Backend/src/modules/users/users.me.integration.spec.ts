import http from 'node:http';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import type { OpenAPIObject } from '@nestjs/swagger';
import { Test, type TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request, { type Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AuthProvider, UserStatus } from '../../generated/prisma/enums.js';
import { AppModule } from '../../app.module.js';
import { configureHttpApp, setupSwagger } from '../../configure-app.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

const PASSWORD = 'Flora@2026';
const OTHER_SECRET = 'another-access-secret-value-32chars!!';

const PROFILE_KEYS = [
  'avatarAssetId',
  'createdAt',
  'id',
  'nickname',
  'status',
] as const;

const meSuccessSchema = z.object({
  code: z.literal('OK'),
  message: z.literal('success'),
  requestId: z.string(),
  data: z.object({
    id: z.string(),
    nickname: z.string().nullable(),
    avatarAssetId: z.string().nullable(),
    status: z.literal('ACTIVE'),
    createdAt: z.string(),
  }),
});

describe('GET /users/me against MySQL', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let document: OpenAPIObject;
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
    document = setupSwagger(app);
    await app.init();
    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
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
    const demo = await prisma.user.findUnique({
      where: { id: 'usr_demo_001' },
    });
    expect(demo?.nickname).toBe('摘星重现');
    await app.close();
  }, 30_000);

  it('documents bearer auth only on the current-user route', () => {
    expect(document.security).toBeUndefined();
    expect(document.components?.securitySchemes).toHaveProperty('access-token');
    expect(readSecurity(document, '/api/v1/users/me', 'get')).toEqual([
      { 'access-token': [] },
    ]);
    expect(readSecurity(document, '/api/v1/health', 'get')).toBeUndefined();
    expect(
      readSecurity(document, '/api/v1/auth/login', 'post'),
    ).toBeUndefined();
    expect(
      readSecurity(document, '/api/v1/auth/register', 'post'),
    ).toBeUndefined();
  });

  it('rejects a request without a token', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/users/me');

    expectAuthError(response, 'UNAUTHORIZED', 'Unauthorized');
  });

  it('rejects a token with an invalid signature', async () => {
    const token = new JwtService().sign(
      { sub: 'usr_forged' },
      { secret: OTHER_SECRET, expiresIn: 900 },
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expectAuthError(response, 'INVALID_TOKEN', 'Invalid token');
  });

  it('rejects an expired token', async () => {
    const registered = await registerUser();
    const token = jwtService.sign(
      { sub: registered.userId },
      { expiresIn: -10 },
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expectAuthError(response, 'TOKEN_EXPIRED', 'Token expired');
    expect(response.text).not.toContain('jwt expired');
  }, 30_000);

  it('rejects a token without sub', async () => {
    const token = jwtService.sign({ aud: 'floraverse' }, { expiresIn: 900 });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expectAuthError(response, 'INVALID_TOKEN', 'Invalid token');
  });

  it('returns the active profile for a valid access token', async () => {
    const registered = await registerUser('星辰');
    const token = await login(registered.username);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const body = meSuccessSchema.parse(readJson(response));
    expect(body.data.id).toBe(registered.userId);
    expect(body.data.nickname).toBe('星辰');
    expect(Object.keys(body.data).sort()).toEqual([...PROFILE_KEYS]);
    expect(response.text).not.toContain('passwordHash');
    expect(response.text).not.toContain('providerSubject');
    expect(response.text).not.toContain(PASSWORD);
  }, 30_000);

  it('rejects a token whose user does not exist', async () => {
    const token = jwtService.sign(
      { sub: `usr_missing_${randomBytes(4).toString('hex')}` },
      { expiresIn: 900 },
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expectAuthError(response, 'UNAUTHORIZED', 'Unauthorized');
  });

  it.each([
    UserStatus.DISABLED,
    UserStatus.PENDING_DELETION,
    UserStatus.DELETED,
  ])(
    'rejects a %s user',
    async (status) => {
      const registered = await registerUser();
      const token = await login(registered.username);
      await prisma.user.update({
        where: { id: registered.userId },
        data: { status },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expectAuthError(response, 'USER_NOT_ACTIVE', 'User is not active');
      expect(response.text).not.toContain('passwordHash');
      expect(response.text).not.toContain('providerSubject');
    },
    30_000,
  );

  it('rejects the original token after the user is disabled', async () => {
    const registered = await registerUser();
    const token = await login(registered.username);
    const before = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    await prisma.user.update({
      where: { id: registered.userId },
      data: { status: UserStatus.DISABLED },
    });

    const after = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expectAuthError(after, 'USER_NOT_ACTIVE', 'User is not active');
  }, 30_000);

  it('rejects a request that repeats the Authorization header', async () => {
    const registered = await registerUser();
    const token = await login(registered.username);
    await app.listen(0, '127.0.0.1');
    const response = await sendDuplicateAuthorization(
      app.getHttpServer(),
      token,
    );

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body) as unknown).toMatchObject({
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
    });
    expect(response.body).not.toContain('passwordHash');
    expect(response.body).not.toContain('providerSubject');
  }, 30_000);

  it('keeps the health route anonymous', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(readJson(response)).toMatchObject({ code: 'OK' });
  });

  it('keeps login anonymous', async () => {
    const registered = await registerUser();

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: registered.username, password: PASSWORD });

    expect(response.status).toBe(200);
    expect(readJson(response)).toMatchObject({
      code: 'OK',
      data: { tokenType: 'Bearer', expiresIn: 900 },
    });
  }, 30_000);

  async function registerUser(
    nickname?: string,
  ): Promise<{ userId: string; username: string }> {
    const username = `Me${randomBytes(4).toString('hex')}`;
    subjects.push(username);
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password: PASSWORD, nickname });
    expect(response.status).toBe(201);
    const userId = z
      .object({ data: z.object({ user: z.object({ id: z.string() }) }) })
      .parse(readJson(response)).data.user.id;
    createdUserIds.push(userId);
    return { userId, username };
  }

  async function login(username: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password: PASSWORD });
    expect(response.status).toBe(200);
    return z
      .object({ data: z.object({ accessToken: z.string().min(1) }) })
      .parse(readJson(response)).data.accessToken;
  }
});

interface RawHttpResponse {
  statusCode: number;
  body: string;
}

function sendDuplicateAuthorization(
  server: unknown,
  token: string,
): Promise<RawHttpResponse> {
  if (!(server instanceof http.Server)) {
    throw new Error('Expected an HTTP server');
  }
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected the test server to listen on a TCP port');
  }
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: '/api/v1/users/me',
        method: 'GET',
        headers: {
          Authorization: [`Bearer ${token}`, 'Bearer second-token'],
        },
      },
      (res: http.IncomingMessage): void => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer | string): void => {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        });
        res.on('end', (): void => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function readJson(response: Response): unknown {
  return JSON.parse(response.text) as unknown;
}

function expectAuthError(
  response: Response,
  code: string,
  message: string,
): void {
  expect(response.status).toBe(401);
  expect(readJson(response)).toMatchObject({ code, message });
  expect(response.text).not.toContain('passwordHash');
  expect(response.text).not.toContain('providerSubject');
}

function readSecurity(
  document: OpenAPIObject,
  path: string,
  method: 'get' | 'post',
): unknown {
  const operation = document.paths[path]?.[method];
  if (operation === undefined) {
    throw new Error(
      `Missing OpenAPI operation ${method.toUpperCase()} ${path}`,
    );
  }
  return operation.security;
}
