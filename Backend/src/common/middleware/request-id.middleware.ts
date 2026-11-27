import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Injectable, type NestMiddleware } from '@nestjs/common';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

export function resolveRequestId(header: string | undefined): string {
  if (header !== undefined && REQUEST_ID_PATTERN.test(header)) {
    return header;
  }
  return `req_${randomUUID()}`;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.get('x-request-id'));
    request.id = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  }
}
