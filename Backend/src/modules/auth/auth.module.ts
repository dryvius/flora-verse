import { Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JwtModule,
  type JwtModuleOptions,
  type JwtOptionsFactory,
} from '@nestjs/jwt';
import type { EnvConfig } from '../../common/config/env.schema.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PrismaModule } from '../../infrastructure/database/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  AccessTokenService,
} from './services/access-token.service.js';
import { PasswordHasherService } from './services/password-hasher.service.js';

@Injectable()
class AccessTokenJwtOptions implements JwtOptionsFactory {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  createJwtOptions(): JwtModuleOptions {
    return {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      signOptions: {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      },
    };
  }
}

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useClass: AccessTokenJwtOptions,
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordHasherService,
    AccessTokenService,
    AuthService,
    JwtAuthGuard,
  ],
  exports: [PasswordHasherService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
