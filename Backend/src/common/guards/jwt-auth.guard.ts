import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { CurrentUser } from '../auth/current-user.js';

const UNAUTHORIZED = {
  code: 'UNAUTHORIZED',
  message: 'Unauthorized',
} as const;

const INVALID_TOKEN = {
  code: 'INVALID_TOKEN',
  message: 'Invalid token',
} as const;

const TOKEN_EXPIRED = {
  code: 'TOKEN_EXPIRED',
  message: 'Token expired',
} as const;

const BEARER_TOKEN_PATTERN = /^Bearer ([^\s]+)$/i;
const AUTHORIZATION_HEADER_NAME = 'authorization';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    assertSingleAuthorizationHeader(request.rawHeaders);
    const token = readBearerToken(request.headers.authorization);
    const currentUser: CurrentUser = {
      id: readSubject(this.verifyAccessToken(token)),
    };
    request.currentUser = currentUser;
    return true;
  }

  private verifyAccessToken(token: string): unknown {
    try {
      return this.jwtService.verify(token, {
        algorithms: ['HS256'],
      });
    } catch (error: unknown) {
      // TokenExpiredError 继承 JsonWebTokenError，过期必须先识别。
      if (isTokenExpiredError(error)) {
        throw new UnauthorizedException(TOKEN_EXPIRED);
      }
      if (isJsonWebTokenError(error)) {
        throw new UnauthorizedException(INVALID_TOKEN);
      }
      throw error;
    }
  }
}

function assertSingleAuthorizationHeader(
  rawHeaders: readonly string[] | undefined,
): void {
  const count = countAuthorizationHeaders(rawHeaders);
  if (count === 0) {
    throw new UnauthorizedException(UNAUTHORIZED);
  }
  if (count > 1) {
    throw new UnauthorizedException(INVALID_TOKEN);
  }
}

function countAuthorizationHeaders(
  rawHeaders: readonly string[] | undefined,
): number {
  if (rawHeaders === undefined) {
    return 0;
  }
  let count = 0;
  for (let index = 0; index < rawHeaders.length; index += 2) {
    const name = rawHeaders[index];
    if (
      typeof name === 'string' &&
      name.toLowerCase() === AUTHORIZATION_HEADER_NAME
    ) {
      count += 1;
    }
  }
  return count;
}

function readBearerToken(authorization: string | undefined): string {
  if (authorization === undefined) {
    throw new UnauthorizedException(UNAUTHORIZED);
  }
  const token = BEARER_TOKEN_PATTERN.exec(authorization)?.[1];
  if (token === undefined || token.length === 0) {
    throw new UnauthorizedException(INVALID_TOKEN);
  }
  return token;
}

function readSubject(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new UnauthorizedException(INVALID_TOKEN);
  }
  const subject = payload.sub;
  if (typeof subject !== 'string' || subject.length === 0) {
    throw new UnauthorizedException(INVALID_TOKEN);
  }
  return subject;
}

function isTokenExpiredError(error: unknown): boolean {
  return error instanceof Error && error.name === 'TokenExpiredError';
}

function isJsonWebTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  let prototype: unknown = Object.getPrototypeOf(error);
  while (isRecord(prototype) && prototype !== Object.prototype) {
    const constructor: unknown = prototype.constructor;
    if (
      typeof constructor === 'function' &&
      constructor.name === 'JsonWebTokenError'
    ) {
      return true;
    }
    prototype = Object.getPrototypeOf(prototype);
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
