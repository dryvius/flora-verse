import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { validateEnv } from './common/config/env.schema.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { LoggingInterceptor } from './common/logger/logging.interceptor.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { PrismaModule } from './infrastructure/database/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('{*splat}');
  }
}
