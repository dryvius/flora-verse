import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUser as CurrentUserIdentity } from '../auth/current-user.js';

const UNAUTHORIZED = {
  code: 'UNAUTHORIZED',
  message: 'Unauthorized',
} as const;

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserIdentity => {
    const request = context.switchToHttp().getRequest<Request>();
    const currentUser = request.currentUser;
    if (currentUser === undefined) {
      throw new UnauthorizedException(UNAUTHORIZED);
    }
    return currentUser;
  },
);
