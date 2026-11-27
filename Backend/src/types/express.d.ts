import type { CurrentUser } from '../common/auth/current-user.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
      currentUser?: CurrentUser;
    }
  }
}

export {};
