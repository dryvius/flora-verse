import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentUser } from '../auth/current-user.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const ACCESS_SECRET = 'local-dev-access-secret-change-before-production';
const OTHER_SECRET = 'another-access-secret-value-32chars!!';
const USER_ID = 'usr_demo_001';

describe('JwtAuthGuard', () => {
  const { guard, jwtService } = createGuard();

  it('rejects a request without Authorization', () => {
    const { context } = createContext();

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'UNAUTHORIZED', 'Unauthorized');
  });

  it('ignores tokens supplied outside the Authorization header', () => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const findUnique = vi.fn();
    const { context } = createContext(undefined, {
      query: { access_token: token },
      cookies: { access_token: token },
      body: { accessToken: token },
      prisma: { user: { findUnique } },
    });

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'UNAUTHORIZED', 'Unauthorized');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it.each(['Basic abc.def.ghi', 'Bearer', 'Bearer ', 'Bearer one two'])(
    'rejects malformed Authorization %j',
    (authorization) => {
      const { context } = createContext(authorization);

      const error = captureError(() => guard.canActivate(context));

      expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
    },
  );

  it.each(['bearer', 'BEARER', 'BeArEr'])('accepts a %s scheme', (scheme) => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const { context, request } = createContext(`${scheme} ${token}`);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.currentUser).toEqual({ id: USER_ID });
  });

  it('rejects a token signed with another secret', () => {
    const token = issueToken(new JwtService(), { sub: USER_ID }, OTHER_SECRET);
    const { context, request } = createContext(`Bearer ${token}`);

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
    expect(JSON.stringify(readResponse(error))).not.toContain(
      'invalid signature',
    );
    expect(request.currentUser).toBeUndefined();
  });

  it('rejects an expired token before treating it as a generic JWT error', () => {
    const token = issueToken(jwtService, { sub: USER_ID }, ACCESS_SECRET, -10);
    const { context } = createContext(`Bearer ${token}`);

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'TOKEN_EXPIRED', 'Token expired');
    expect(JSON.stringify(readResponse(error))).not.toContain('jwt expired');
    expect(JSON.stringify(readResponse(error))).not.toContain('expiredAt');
  });

  it('rejects a token without sub', () => {
    const token = issueToken(jwtService, { aud: 'floraverse' });
    const { context } = createContext(`Bearer ${token}`);

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
  });

  it('rejects a token whose sub is empty', () => {
    const token = issueToken(jwtService, { sub: '' });
    const { context } = createContext(`Bearer ${token}`);

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
  });

  it('rejects a token whose sub is not a string', () => {
    const token = issueToken(jwtService, { sub: 42 });
    const { context } = createContext(`Bearer ${token}`);

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
  });

  it('stores only the subject for a valid token', () => {
    const token = issueToken(jwtService, {
      sub: USER_ID,
      username: '摘星重现',
    });
    const { context, request } = createContext(`Bearer ${token}`);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.currentUser).toEqual({ id: USER_ID });
    expect(request.currentUser).not.toHaveProperty('username');
  });

  it('verifies with HS256 only', () => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const otherAlgorithm = jwtService.sign(
      { sub: USER_ID },
      { secret: ACCESS_SECRET, algorithm: 'HS384', expiresIn: 900 },
    );
    const verify = vi.spyOn(jwtService, 'verify');
    const { context } = createContext(`Bearer ${token}`);

    try {
      expect(guard.canActivate(context)).toBe(true);
      expect(verify).toHaveBeenCalledWith(token, { algorithms: ['HS256'] });

      const rejected = captureError(() =>
        guard.canActivate(createContext(`Bearer ${otherAlgorithm}`).context),
      );
      expectUnauthorized(rejected, 'INVALID_TOKEN', 'Invalid token');
    } finally {
      verify.mockRestore();
    }
  });

  it('rejects two Authorization headers from rawHeaders', () => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const { context, request } = createContext(`Bearer ${token}`, {
      rawHeaders: [
        'Authorization',
        `Bearer ${token}`,
        'Authorization',
        'Bearer second-token',
      ],
    });

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
    expect(request.currentUser).toBeUndefined();
  });

  it('rejects two Authorization headers whose names differ only by case', () => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const { context, request } = createContext(`Bearer ${token}`, {
      rawHeaders: [
        'authorization',
        `Bearer ${token}`,
        'AUTHORIZATION',
        `Bearer ${token}`,
      ],
    });

    const error = captureError(() => guard.canActivate(context));

    expectUnauthorized(error, 'INVALID_TOKEN', 'Invalid token');
    expect(request.currentUser).toBeUndefined();
  });

  it('accepts one Authorization header alongside unrelated headers', () => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const { context, request } = createContext(`Bearer ${token}`, {
      rawHeaders: [
        'Host',
        'localhost',
        'Authorization',
        `Bearer ${token}`,
        'Accept',
        'application/json',
      ],
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.currentUser).toEqual({ id: USER_ID });
  });

  it('does not query Prisma', () => {
    const token = issueToken(jwtService, { sub: USER_ID });
    const findUnique = vi.fn();
    const findMany = vi.fn();
    const { context, request } = createContext(`Bearer ${token}`, {
      prisma: { user: { findUnique, findMany } },
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.currentUser).toEqual({ id: USER_ID });
    expect(findUnique).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
    expect(guard).not.toHaveProperty('prisma');
  });
});

function createGuard(): { guard: JwtAuthGuard; jwtService: JwtService } {
  const jwtService = new JwtService({ secret: ACCESS_SECRET });
  return {
    jwtService,
    guard: new JwtAuthGuard(jwtService),
  };
}

function issueToken(
  jwtService: JwtService,
  payload: Record<string, unknown>,
  secret = ACCESS_SECRET,
  expiresIn = 900,
): string {
  return jwtService.sign(payload, { secret, expiresIn });
}

interface GuardRequest {
  headers: { authorization?: string };
  rawHeaders: string[];
  currentUser?: CurrentUser;
  query?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: Record<string, string>;
  prisma?: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany?: ReturnType<typeof vi.fn>;
    };
  };
}

function createContext(
  authorization?: string,
  extras: Omit<GuardRequest, 'headers' | 'currentUser' | 'rawHeaders'> & {
    rawHeaders?: string[];
  } = {},
): { context: ExecutionContext; request: GuardRequest } {
  const { rawHeaders = defaultRawHeaders(authorization), ...rest } = extras;
  const request: GuardRequest = {
    ...rest,
    headers: authorization === undefined ? {} : { authorization },
    rawHeaders,
  };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
  return { context, request };
}

function defaultRawHeaders(authorization: string | undefined): string[] {
  if (authorization === undefined) {
    return [];
  }
  return ['Authorization', authorization];
}

function captureError(run: () => boolean): unknown {
  try {
    run();
  } catch (error: unknown) {
    return error;
  }
  throw new Error('Expected the guard to throw');
}

function expectUnauthorized(
  error: unknown,
  code: string,
  message: string,
): void {
  expect(error).toBeInstanceOf(UnauthorizedException);
  if (!(error instanceof UnauthorizedException)) {
    return;
  }
  expect(error.getStatus()).toBe(401);
  expect(error.getResponse()).toEqual({ code, message });
}

function readResponse(error: unknown): unknown {
  if (!(error instanceof UnauthorizedException)) {
    return error;
  }
  return error.getResponse();
}
