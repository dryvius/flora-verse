import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/api/http'
import { ERROR_CODES } from '@/constants/error-codes'
import { HttpAuthRepository } from '@/repositories/http/http-auth-repository'
import type { BackendUserProfile, LoginResult, RegisterResult } from '@/types/auth'
import { BusinessError } from '@/utils/business-error'
import { getAccessToken, setAccessToken } from '@/utils/token-storage'
import { getCapturedRequests, resetUniMock, setRequestHandler } from '@/test/uni-mock'

const backendUser: BackendUserProfile = {
  id: 'usr_real',
  nickname: '星辰',
  avatarAssetId: 'ast_avatar_001',
  status: 'ACTIVE',
  createdAt: '2026-11-26T06:00:00.000Z'
}

function respond(statusCode: number, body: unknown): void {
  setRequestHandler((options): void => {
    options.success?.({ statusCode, data: body })
  })
}

function okBody<T>(data: T, requestId = 'req_ok'): { code: string; message: string; data: T; requestId: string } {
  return {
    code: 'OK',
    message: 'success',
    data,
    requestId
  }
}

describe('HTTP 契约与 Token 注入', () => {
  const authRepository = new HttpAuthRepository()

  beforeEach((): void => {
    resetUniMock()
    vi.unstubAllEnvs()
  })

  it('解包 code 为 OK 的成功响应', async (): Promise<void> => {
    respond(200, okBody({ id: 'usr_1' }))

    const result = await request<{ id: string }>({ url: '/api/v1/users/me' })

    expect(result).toEqual({ id: 'usr_1' })
  })

  it('把 HTTP 201 的注册成功结果原样返回，并且不保存 Token', async (): Promise<void> => {
    const registered: RegisterResult = {
      user: backendUser,
      username: '摘星重现'
    }
    setAccessToken('must-stay-unused')
    respond(201, okBody(registered, 'req_register'))

    const result = await authRepository.register({
      username: '摘星重现',
      password: 'Flora@2026',
      nickname: '星辰'
    })

    expect(result).toEqual(registered)
    expect(getAccessToken()).toBe('must-stay-unused')
    const call = getCapturedRequests()[0]
    expect(call?.method).toBe('POST')
    expect(call?.url).toBe(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/register`)
    expect(call?.header.Authorization).toBeUndefined()
  })

  it('保留 401 的后端业务码、状态码和 requestId', async (): Promise<void> => {
    respond(401, {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid credentials',
      requestId: 'req_401'
    })

    const error: unknown = await authRepository.login({ username: '摘星重现', password: 'bad' }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(BusinessError)
    expect(error).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
      requestId: 'req_401',
      userMessage: 'Invalid credentials'
    })
    expect((error as BusinessError).code).not.toBe(ERROR_CODES.NETWORK_ERROR)
  })

  it('把 uni.request 失败识别为网络错误', async (): Promise<void> => {
    setRequestHandler((options): void => {
      options.fail?.({ errMsg: 'request:fail' })
    })

    const error: unknown = await request({ url: '/api/v1/users/me' }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(BusinessError)
    expect(error).toMatchObject({
      code: ERROR_CODES.NETWORK_ERROR,
      statusCode: null,
      requestId: null
    })
  })

  it('auth 为 false 时不注入 Authorization，也不把 Token 放进 URL 或 Body', async (): Promise<void> => {
    setAccessToken('secret-token')
    const loginResult: LoginResult = {
      accessToken: 'issued-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: backendUser,
      username: '摘星重现'
    }
    respond(200, okBody(loginResult))

    const result = await authRepository.login({
      username: '摘星重现',
      password: 'Flora@2026'
    })

    const call = getCapturedRequests()[0]
    expect(result).toEqual(loginResult)
    expect(call?.header.Authorization).toBeUndefined()
    expect(call?.url).not.toContain('secret-token')
    expect(call?.url).not.toContain('issued-token')
    expect(JSON.stringify(call?.data)).not.toContain('secret-token')
    expect(JSON.stringify(call?.data)).not.toContain('issued-token')
    expect(getAccessToken()).toBe('secret-token')
  })

  it('有 Token 时自动注入 Authorization', async (): Promise<void> => {
    setAccessToken('live-token')
    respond(200, okBody(backendUser))

    await request({ url: '/api/v1/users/me' })

    expect(getCapturedRequests()[0]?.header.Authorization).toBe('Bearer live-token')
  })

  it('没有 Token 时不注入 Authorization', async (): Promise<void> => {
    respond(200, okBody(backendUser))

    await request({ url: '/api/v1/users/me' })

    expect(getCapturedRequests()[0]?.header.Authorization).toBeUndefined()
  })

  it('Base URL 未配置时返回明确的配置错误', async (): Promise<void> => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    const error: unknown = await request({ url: '/api/v1/auth/login', method: 'POST', auth: false }).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ code: ERROR_CODES.API_BASE_URL_MISSING })
    expect(getCapturedRequests()).toHaveLength(0)
  })
})
