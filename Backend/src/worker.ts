import { Logger, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { RedactingLogger } from './common/logger/redacting-logger.js';
import { PrismaService } from './infrastructure/database/prisma.service.js';

let applicationContext: INestApplicationContext | undefined;

async function bootstrap(): Promise<void> {
  const logger = new RedactingLogger();
  Logger.overrideLogger(logger);

  applicationContext = await NestFactory.createApplicationContext(AppModule, {
    logger,
  });
  applicationContext.enableShutdownHooks();

  const prisma = applicationContext.get(PrismaService);
  await prisma.ping();
  logger.log(
    'Worker ready. Task polling is intentionally not started in the bootstrap phase.',
    'Worker',
  );
}

try {
  await bootstrap();
} catch (error: unknown) {
  const logger = new Logger('Worker');
  if (
    error instanceof Error &&
    error.message.startsWith('Invalid environment variables')
  ) {
    logger.error(error.message);
  } else {
    logger.error(
      `Worker failed to start (${error instanceof Error ? error.name : 'UnknownError'})`,
    );
  }
  process.exit(1);
}
