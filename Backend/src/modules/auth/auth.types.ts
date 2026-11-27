import type { UserProfile } from '../users/users.types.js';

export interface RegisterResult {
  user: UserProfile;
  username: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserProfile;
  username: string;
}
