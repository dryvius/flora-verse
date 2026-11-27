import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import type { EnvConfig } from './common/config/env.schema.js';
import { RedactingLogger } from './common/logger/redacting-logger.js';
import {
  configureHttpApp,
  isSwaggerEnabled,
  setupSwagger,
} from './configure-app.js';

async function bootstrap(): Promise<void> {
  const logger = new RedactingLogger();
  Logger.overrideLogger(logger);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger,
  });
  const config = app.get(ConfigService<EnvConfig, true>);
  configureHttpApp(app);

  if (isSwaggerEnabled(config)) {
    setupSwagger(app);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`API listening on port ${port}`, 'Bootstrap');
  if (isSwaggerEnabled(config)) {
    logger.log('Swagger UI available at /api/docs', 'Bootstrap');
  }
}

try {
  await bootstrap();
} catch (error: unknown) {
  logStartupFailure(error);
  process.exit(1);
}

function logStartupFailure(error: unknown): void {
  const logger = new Logger('Bootstrap');
  if (
    error instanceof Error &&
    error.message.startsWith('Invalid environment variables')
  ) {
    logger.error(error.message);
    return;
  }
  logger.error(
    `Application failed to start (${error instanceof Error ? error.name : 'UnknownError'})`,
  );
}
