import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import type { ApiSuccessResponse } from '../dto/api-response.js';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.id || `req_${randomUUID()}`;

    return next.handle().pipe(
      map((data: T): ApiSuccessResponse<T> => ({
        code: 'OK',
        message: 'success',
        data,
        requestId,
      })),
    );
  }
}
