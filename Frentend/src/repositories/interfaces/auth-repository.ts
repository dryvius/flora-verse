import type { LoginPayload, LoginResult, RegisterPayload, RegisterResult } from '@/types/auth'

export interface AuthRepository {
  register(payload: RegisterPayload): Promise<RegisterResult>
  login(payload: LoginPayload): Promise<LoginResult>
}
