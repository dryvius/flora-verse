import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '../dto/api-response.js';

const STATUS_CODES: Readonly<Record<number, string>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
};

interface ResolvedHttpError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const resolved = this.resolve(exception);
    const requestId = request.id || `req_${randomUUID()}`;

    if (!request.id) {
      response.setHeader('x-request-id', requestId);
    }

    this.logger.error(
      `${request.method} ${request.originalUrl} ${resolved.status} ${resolved.code} ${
        exception instanceof Error ? exception.name : 'UnknownError'
      } ${requestId}`,
    );

    const body: ApiErrorResponse = {
      code: resolved.code,
      message: resolved.message,
      requestId,
    };
    if (resolved.details !== undefined) {
      body.details = resolved.details;
    }

    response.status(resolved.status).json(body);
  }

  private resolve(exception: unknown): ResolvedHttpError {
    if (!(exception instanceof HttpException)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      };
    }

    const status = exception.getStatus();
    const exceptionResponse: unknown = exception.getResponse();
    if (typeof exceptionResponse === 'string') {
      return {
        status,
        code: this.codeForStatus(status),
        message: exceptionResponse,
      };
    }

    if (!isRecord(exceptionResponse)) {
      return {
        status,
        code: this.codeForStatus(status),
        message: exception.message,
      };
    }

    const rawMessage = exceptionResponse.message;
    const rawCode = exceptionResponse.code;
    const isValidation = Array.isArray(rawMessage);
    const code =
      typeof rawCode === 'string' && rawCode.length > 0
        ? rawCode
        : isValidation
          ? 'VALIDATION_ERROR'
          : this.codeForStatus(status);

    return {
      status,
      code,
      message: isValidation
        ? 'Validation failed'
        : typeof rawMessage === 'string'
          ? rawMessage
          : exception.message,
      details: isValidation
        ? { fields: rawMessage.filter((item) => typeof item === 'string') }
        : undefined,
    };
  }

  private codeForStatus(status: number): string {
    return STATUS_CODES[status] ?? 'INTERNAL_ERROR';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
