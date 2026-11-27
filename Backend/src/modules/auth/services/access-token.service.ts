import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { EnvConfig } from '../../../common/config/env.schema.js';

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
}

interface AccessTokenClaims {
  sub: string;
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly jwtService: JwtService,
  ) {}

  issue(userId: string): IssuedAccessToken {
    const secret = this.readAccessSecret();
    const claims: AccessTokenClaims = { sub: userId };
    const accessToken = this.jwtService.sign(claims, {
      secret,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    });
    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }

  private readAccessSecret(): string {
    const secret: unknown = this.config.get('JWT_ACCESS_SECRET', {
      infer: true,
    });
    if (typeof secret !== 'string' || secret.length === 0) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    return secret;
  }
}
