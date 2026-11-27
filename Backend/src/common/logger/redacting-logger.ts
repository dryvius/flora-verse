import { ConsoleLogger } from '@nestjs/common';
import { redactSecrets, redactUnknown } from './redact-secrets.js';

export class RedactingLogger extends ConsoleLogger {
  override log(message: unknown, context?: string): void {
    super.log(redactUnknown(message), context);
  }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    const redactedParams = optionalParams.map((item) =>
      typeof item === 'string' ? redactSecrets(item) : item,
    );
    super.error(redactUnknown(message), ...redactedParams);
  }

  override warn(message: unknown, context?: string): void {
    super.warn(redactUnknown(message), context);
  }

  override debug(message: unknown, context?: string): void {
    super.debug(redactUnknown(message), context);
  }

  override verbose(message: unknown, context?: string): void {
    super.verbose(redactUnknown(message), context);
  }
}
