import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import helmet from 'helmet';
import type { EnvConfig } from './common/config/env.schema.js';

export function isSwaggerEnabled(
  config: ConfigService<EnvConfig, true>,
): boolean {
  return (
    config.get('NODE_ENV', { infer: true }) !== 'production' ||
    config.get('SWAGGER_ENABLED', { infer: true })
  );
}

export function configureHttpApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService<EnvConfig, true>);
  const corsOrigin = config.get('CORS_ORIGIN', { infer: true });

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.use(
    helmet({
      contentSecurityPolicy: isSwaggerEnabled(config) ? false : undefined,
    }),
  );

  if (corsOrigin !== undefined) {
    app.enableCors({ origin: corsOrigin, credentials: false });
  }

  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

export function setupSwagger(app: NestExpressApplication): OpenAPIObject {
  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get('PORT', { infer: true });
  const config = new DocumentBuilder()
    .setTitle('FloraVerse API')
    .setDescription(
      'FloraVerse 微信小程序后端接口。受保护接口使用 Authorization: Bearer access token，Swagger security scheme 名称为 access-token。',
    )
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '登录接口签发的 access token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
  });
  return document;
}
