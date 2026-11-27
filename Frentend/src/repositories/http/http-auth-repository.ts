import { API_ENDPOINTS } from '@/api/endpoints'
import { request } from '@/api/http'
import type { AuthRepository } from '@/repositories/interfaces/auth-repository'
import type { LoginPayload, LoginResult, RegisterPayload, RegisterResult } from '@/types/auth'

export class HttpAuthRepository implements AuthRepository {
  async register(payload: RegisterPayload): Promise<RegisterResult> {
    return request<RegisterResult>({
      url: API_ENDPOINTS.authRegister,
      method: 'POST',
      data: toRegisterBody(payload),
      auth: false
    })
  }

  async login(payload: LoginPayload): Promise<LoginResult> {
    return request<LoginResult>({
      url: API_ENDPOINTS.authLogin,
      method: 'POST',
      data: {
        username: payload.username,
        password: payload.password
      },
      auth: false
    })
  }
}

function toRegisterBody(payload: RegisterPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    username: payload.username,
    password: payload.password
  }
  if (payload.nickname !== undefined) {
    body.nickname = payload.nickname
  }
  return body
}
