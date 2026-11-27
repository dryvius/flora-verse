import { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { EnvConfig } from '../../../common/config/env.schema.js';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  AccessTokenService,
} from './access-token.service.js';

const ACCESS_SECRET = 'local-dev-access-secret-change-before-production';
const USER_ID = 'usr_demo_001';

interface JwtTimeClaims {
  sub: string;
  iat: number;
  exp: number;
}

describe('AccessTokenService', () => {
  it('signs a 900 second token whose sub is the user id', () => {
    const get = vi.fn().mockReturnValue(ACCESS_SECRET);
    const { service, jwtService } = createService(get);
    const sign = vi.spyOn(jwtService, 'sign');

    const issued = service.issue(USER_ID);
    const claims = readJwtClaims(issued.accessToken);

    expect(ACCESS_TOKEN_EXPIRES_IN_SECONDS).toBe(900);
    expect(get).toHaveBeenCalledWith('JWT_ACCESS_SECRET', { infer: true });
    expect(sign).toHaveBeenCalledWith(
      { sub: USER_ID },
      { secret: ACCESS_SECRET, expiresIn: 900 },
    );
    expect(issued.expiresIn).toBe(900);
    expect(issued.accessToken.split('.')).toHaveLength(3);
    expect(claims.sub).toBe(USER_ID);
    expect(claims.exp - claims.iat).toBe(900);
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'sub']);
    expect(JSON.stringify(claims)).not.toContain('password');
    expect(JSON.stringify(claims)).not.toContain('passwordHash');
    expect(JSON.stringify(claims)).not.toContain(ACCESS_SECRET);
    expect(() => {
      jwtService.verify(issued.accessToken, { secret: ACCESS_SECRET });
    }).not.toThrow();
    expect(() => {
      jwtService.verify(issued.accessToken, {
        secret: 'different-access-secret-value-32chars',
      });
    }).toThrow();
  });

  it('uses a distinct sub for each user', () => {
    const { service } = createService(vi.fn().mockReturnValue(ACCESS_SECRET));

    const first = readJwtClaims(service.issue('usr_one').accessToken);
    const second = readJwtClaims(service.issue('usr_two').accessToken);

    expect(first.sub).toBe('usr_one');
    expect(second.sub).toBe('usr_two');
    expect(first.sub).not.toBe(second.sub);
  });

  it('fails when the access secret is missing or empty', () => {
    const missing = createService(vi.fn().mockReturnValue(undefined));
    const empty = createService(vi.fn().mockReturnValue(''));
    const missingSign = vi.spyOn(missing.jwtService, 'sign');
    const emptySign = vi.spyOn(empty.jwtService, 'sign');

    expect(() => missing.service.issue(USER_ID)).toThrow(
      'JWT_ACCESS_SECRET is not configured',
    );
    expect(() => empty.service.issue(USER_ID)).toThrow(
      'JWT_ACCESS_SECRET is not configured',
    );
    expect(missingSign).not.toHaveBeenCalled();
    expect(emptySign).not.toHaveBeenCalled();
  });
});

function createService(get: ReturnType<typeof vi.fn>): {
  service: AccessTokenService;
  jwtService: JwtService;
} {
  const jwtService = new JwtService();
  return {
    jwtService,
    service: new AccessTokenService(
      { get } as unknown as ConfigService<EnvConfig, true>,
      jwtService,
    ),
  };
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
  const extraKeys = Object.keys(parsed).filter(
    (key) => key !== 'sub' && key !== 'iat' && key !== 'exp',
  );
  if (extraKeys.length > 0) {
    throw new Error('JWT payload has unexpected claims');
  }
  return parsed;
}

function isJwtTimeClaims(value: unknown): value is JwtTimeClaims {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.sub === 'string' &&
    typeof value.iat === 'number' &&
    typeof value.exp === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
