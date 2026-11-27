import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_USER_ID } from '@/constants/app'
import { AuthStatus } from '@/enums/auth-status'
import { login, register } from '@/services/auth-service'
import { useUserStore } from '@/stores/user-store'
import type { BackendUserProfile, LoginResult, RegisterResult } from '@/types/auth'
import { getCapturedRequests, resetUniMock, setRequestHandler } from '@/test/uni-mock'
import { getAccessToken, setAccessToken } from '@/utils/token-storage'

const loginUser: BackendUserProfile = {
  id: 'usr_login',
  nickname: '登录返回',
  avatarAssetId: null,
  status: 'ACTIVE',
  createdAt: '2026-11-26T06:00:00.000Z'
}

const confirmedUser: BackendUserProfile = {
  id: 'usr_login',
  nickname: '身份确认',
  avatarAssetId: 'ast_confirmed',
  status: 'ACTIVE',
  createdAt: '2026-11-26T06:00:00.000Z'
}

interface RequestOptions {
  url: string
  data?: unknown
  header?: Record<string, string>
  success?: (result: { statusCode?: number; data?: unknown }) => void
  fail?: (error: { errMsg: string }) => void
}

function envelope<T>(data: T): {
  code: string
  message: string
  data: T
  requestId: string
} {
  return {
    code: 'OK',
    message: 'success',
    data,
    requestId: 'req_auth'
  }
}

function errorBody(code: string, message: string): {
  code: string
  message: string
  requestId: string
} {
  return {
    code,
    message,
    requestId: 'req_auth'
  }
}

function loginData(accessToken = 'live-token'): LoginResult {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: loginUser,
    username: 'Flora'
  }
}

function registerData(): RegisterResult {
  return {
    user: loginUser,
    username: 'Flora'
  }
}

function captureRequests(): { next: () => Promise<RequestOptions> } {
  const waiting: Array<(options: RequestOptions) => void> = []
  const buffered: RequestOptions[] = []
  setRequestHandler((options): void => {
    const resolve = waiting.shift()
    if (resolve) {
      resolve(options)
      return
    }
    buffered.push(options)
  })
  return {
    next: (): Promise<RequestOptions> => {
      const existing = buffered.shift()
      if (existing) {
        return Promise.resolve(existing)
      }
      return new Promise((resolve) => {
        waiting.push(resolve)
      })
    }
  }
}

describe('注册', () => {
  beforeEach((): void => {
    resetUniMock()
    setActivePinia(createPinia())
  })

  it('注册成功且不会自动登录', async (): Promise<void> => {
    const store = useUserStore()
    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 201,
        data: envelope(registerData())
      })
    })

    const result = await register({
      username: '  Flora  ',
      password: '  Flora@  ',
      nickname: '   '
    })

    expect(result.username).toBe('Flora')
    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.profile).toBeNull()
    expect(getCapturedRequests()).toHaveLength(1)
    const call = getCapturedRequests()[0]
    expect(call?.url).toBe(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/register`)
    expect(call?.method).toBe('POST')
    expect(call?.data).toEqual({
      username: 'Flora',
      password: '  Flora@  '
    })
    expect(call?.header).not.toHaveProperty('Authorization')
  })

  it('带昵称注册时才把昵称发给后端', async (): Promise<void> => {
    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 201,
        data: envelope(registerData())
      })
    })

    await register({
      username: 'Flora',
      password: 'Flora@2026',
      nickname: '星辰'
    })

    expect(getCapturedRequests()[0]?.data).toEqual({
      username: 'Flora',
      password: 'Flora@2026',
      nickname: '星辰'
    })
  })

  it('用户名重复时提示中文错误且不保存 Token', async (): Promise<void> => {
    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 409,
        data: errorBody('USERNAME_ALREADY_EXISTS', 'Username already exists')
      })
    })

    await expect(register({ username: 'Flora', password: 'Flora@2026' })).rejects.toMatchObject({
      code: 'USERNAME_ALREADY_EXISTS',
      userMessage: '这个用户名已经有人使用了'
    })
    expect(getAccessToken()).toBeNull()
  })

  it('参数校验失败时不展示服务端原文', async (): Promise<void> => {
    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 400,
        data: errorBody('INVALID_USERNAME', 'Username is invalid')
      })
    })

    await expect(register({ username: 'Flora', password: 'Flora@2026' })).rejects.toMatchObject({
      code: 'INVALID_USERNAME',
      userMessage: '用户名不符合规则'
    })
  })

  it('网络失败和服务端异常都给出可理解的提示', async (): Promise<void> => {
    setRequestHandler((options): void => {
      options.fail?.({ errMsg: 'request:fail' })
    })

    await expect(register({ username: 'Flora', password: 'Flora@2026' })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      userMessage: '网络异常，请稍后重试'
    })

    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 500,
        data: errorBody('INTERNAL_ERROR', 'Internal server error')
      })
    })

    await expect(register({ username: 'Flora', password: 'Flora@2026' })).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      userMessage: '注册服务暂时不可用，请稍后再试'
    })
    expect(getAccessToken()).toBeNull()
  })
})

describe('登录', () => {
  beforeEach((): void => {
    resetUniMock()
    setActivePinia(createPinia())
  })

  it('身份确认成功后才保存资料并进入已登录', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const pending = login({
      username: '  Flora  ',
      password: '  Flora@  '
    })
    const loginCall = await captured.next()

    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData())
    })

    const meCall = await captured.next()
    expect(loginCall.data).toEqual({
      username: 'Flora',
      password: '  Flora@  '
    })
    expect(getAccessToken()).toBe('live-token')
    expect(store.authStatus).toBe(AuthStatus.Bootstrapping)
    expect(store.profile).toBeNull()
    expect(meCall.url).toBe(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/me`)
    expect(meCall.header?.Authorization).toBe('Bearer live-token')
    meCall.success?.({
      statusCode: 200,
      data: envelope(confirmedUser)
    })
    await pending

    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile).toMatchObject({
      id: 'usr_login',
      displayName: '身份确认',
      avatarAssetId: 'ast_confirmed'
    })
    expect(store.profile?.displayName).not.toBe('登录返回')
  })

  it('用户名或密码错误、账号不可用时不保存 Token', async (): Promise<void> => {
    const store = useUserStore()
    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 401,
        data: errorBody('INVALID_CREDENTIALS', 'Invalid credentials')
      })
    })

    await expect(login({ username: 'Flora', password: 'Flora@2026' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      userMessage: '用户名或密码不正确'
    })
    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(getCapturedRequests()).toHaveLength(1)

    setRequestHandler((options): void => {
      options.success?.({
        statusCode: 403,
        data: errorBody('USER_NOT_ACTIVE', 'User is not active')
      })
    })

    await expect(login({ username: 'Flora', password: 'Flora@2026' })).rejects.toMatchObject({
      code: 'USER_NOT_ACTIVE',
      userMessage: '这个账号暂时无法登录'
    })
    expect(getAccessToken()).toBeNull()
    expect(getCapturedRequests().some((call) => call.url.includes('/users/me'))).toBe(false)
  })

  it('取得 Token 后身份确认失败时保留 Token 并进入 Unavailable', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const pending = login({ username: 'Flora', password: 'Flora@2026' })
    const loginCall = await captured.next()
    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData())
    })
    const meCall = await captured.next()
    meCall.fail?.({ errMsg: 'request:fail timeout' })

    await expect(pending).rejects.toMatchObject({
      code: 'IDENTITY_UNCONFIRMED',
      userMessage: '登录凭证已保存，但暂时无法确认身份，请稍后重试'
    })
    expect(getAccessToken()).toBe('live-token')
    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(store.profile).toBeNull()
    expect(store.bootstrapped).toBe(false)
  })

  it('身份确认返回会话无效时沿用 Store 的处理并且登录不成功', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const pending = login({ username: 'Flora', password: 'Flora@2026' })
    const loginCall = await captured.next()
    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData())
    })
    const meCall = await captured.next()
    meCall.success?.({
      statusCode: 401,
      data: errorBody('TOKEN_EXPIRED', 'Token expired')
    })

    await expect(pending).rejects.toMatchObject({
      code: 'IDENTITY_UNCONFIRMED',
      userMessage: '暂时无法确认身份，请重新登录'
    })
    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
  })

  it('登录进行中再次调用不会重复请求', async (): Promise<void> => {
    const captured = captureRequests()
    const first = login({ username: 'Flora', password: 'Flora@2026' })
    const second = login({ username: 'Other', password: 'Other@2026' })
    const loginCall = await captured.next()

    expect(second).toBe(first)
    expect(getCapturedRequests().filter((call) => call.url.includes('/auth/login'))).toHaveLength(1)
    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData())
    })
    const meCall = await captured.next()
    meCall.success?.({
      statusCode: 200,
      data: envelope(confirmedUser)
    })
    await first
    expect(getCapturedRequests().filter((call) => call.url.includes('/auth/login'))).toHaveLength(1)
    expect(loginCall.data).toEqual({
      username: 'Flora',
      password: 'Flora@2026'
    })
  })

  it('登录请求期间 logout 后，返回的 Token 不会建立会话', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const pending = login({ username: 'Flora', password: 'Flora@2026' })
    const loginCall = await captured.next()
    const loggedOut = store.logout()

    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData('old-token'))
    })

    await expect(pending).rejects.toMatchObject({
      code: 'LOGIN_CANCELLED',
      userMessage: '登录已取消'
    })
    await loggedOut

    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile?.id).toBe(DEMO_USER_ID)
    expect(getCapturedRequests().some((call) => call.url.includes('/users/me'))).toBe(false)
  })

  it('旧登录请求返回后不能覆盖退出状态，新的登录仍可确认身份', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const first = login({ username: 'Flora', password: 'Flora@2026' })
    const firstCall = await captured.next()

    await store.logout()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.profile?.id).toBe(DEMO_USER_ID)
    expect(getAccessToken()).toBeNull()

    const second = login({ username: 'Moss', password: 'Moss@2026' })
    expect(second).not.toBe(first)
    const secondCall = await captured.next()

    firstCall.success?.({
      statusCode: 200,
      data: envelope(loginData('old-token'))
    })
    await expect(first).rejects.toMatchObject({
      code: 'LOGIN_CANCELLED',
      userMessage: '登录已取消'
    })
    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.profile?.id).toBe(DEMO_USER_ID)
    expect(getCapturedRequests().some((call) => call.url.includes('/users/me'))).toBe(false)

    secondCall.success?.({
      statusCode: 200,
      data: envelope(loginData('new-token'))
    })
    const meCall = await captured.next()
    meCall.success?.({
      statusCode: 200,
      data: envelope(confirmedUser)
    })
    await second

    expect(getAccessToken()).toBe('new-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.displayName).toBe('身份确认')
    expect(getCapturedRequests().filter((call) => call.url.includes('/users/me'))).toHaveLength(1)
  })

  it('Token 写入失败时不继续身份确认', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const pending = login({ username: 'Flora', password: 'Flora@2026' })
    const loginCall = await captured.next()
    const uniApi = (globalThis as unknown as { uni: { setStorageSync: (key: string, value: unknown) => void } }).uni
    const original = uniApi.setStorageSync.bind(uniApi)
    uniApi.setStorageSync = (): void => {
      throw new Error('quota exceeded')
    }

    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData())
    })

    try {
      await expect(pending).rejects.toMatchObject({
        code: 'AUTH_REQUEST_FAILED',
        userMessage: '登录服务暂时不可用，请稍后再试'
      })
      expect(getAccessToken()).toBeNull()
      expect(store.authStatus).not.toBe(AuthStatus.Authenticated)
      expect(getCapturedRequests().some((call) => call.url.includes('/users/me'))).toBe(false)
    } finally {
      uniApi.setStorageSync = original
    }
  })

  it('已处于 Unavailable 时，新 Token 写入失败仍按登录服务错误返回', async (): Promise<void> => {
    const store = useUserStore()
    setAccessToken('old-token')
    setRequestHandler((options): void => {
      options.fail?.({ errMsg: 'request:fail' })
    })
    await expect(store.bootstrap()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(store.profile).toBeNull()
    expect(store.bootstrapped).toBe(false)
    const requestsBeforeLogin = getCapturedRequests().length

    const captured = captureRequests()
    const pending = login({ username: 'Flora', password: 'Flora@2026' })
    const loginCall = await captured.next()
    const uniApi = (globalThis as unknown as { uni: { setStorageSync: (key: string, value: unknown) => void } }).uni
    const original = uniApi.setStorageSync.bind(uniApi)
    uniApi.setStorageSync = (): void => {
      throw new Error('quota exceeded')
    }
    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData('new-token'))
    })

    try {
      await expect(pending).rejects.toMatchObject({
        code: 'AUTH_REQUEST_FAILED',
        userMessage: '登录服务暂时不可用，请稍后再试'
      })
      expect(getAccessToken()).toBe('old-token')
      expect(store.authStatus).toBe(AuthStatus.Unavailable)
      expect(store.profile).toBeNull()
      expect(store.bootstrapped).toBe(false)
      expect(getCapturedRequests()).toHaveLength(requestsBeforeLogin + 1)
      expect(getCapturedRequests().filter((call) => call.url.includes('/users/me'))).toHaveLength(1)
    } finally {
      uniApi.setStorageSync = original
    }
  })

  it('身份确认期间重复登录仍返回同一个任务', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const pending = login({ username: 'Flora', password: 'Flora@2026' })
    const loginCall = await captured.next()
    loginCall.success?.({
      statusCode: 200,
      data: envelope(loginData())
    })
    const meCall = await captured.next()

    const again = login({ username: 'Other', password: 'Other@2026' })
    expect(again).toBe(pending)
    expect(getCapturedRequests().filter((call) => call.url.includes('/auth/login'))).toHaveLength(1)
    expect(store.authStatus).toBe(AuthStatus.Bootstrapping)

    meCall.success?.({
      statusCode: 200,
      data: envelope(confirmedUser)
    })
    await pending

    expect(getCapturedRequests().filter((call) => call.url.includes('/auth/login'))).toHaveLength(1)
    expect(getCapturedRequests().filter((call) => call.url.includes('/users/me'))).toHaveLength(1)
    expect(getAccessToken()).toBe('live-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.displayName).toBe('身份确认')
  })

  it('旧登录不能借用新登录的成功状态', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const first = login({ username: 'Flora', password: 'Flora@2026' })
    const firstLogin = await captured.next()
    firstLogin.success?.({
      statusCode: 200,
      data: envelope(loginData('token-a'))
    })
    const firstMe = await captured.next()

    await store.logout()
    const second = login({ username: 'Moss', password: 'Moss@2026' })
    expect(second).not.toBe(first)
    const secondLogin = await captured.next()
    secondLogin.success?.({
      statusCode: 200,
      data: envelope(loginData('token-b'))
    })
    const secondMe = await captured.next()
    secondMe.success?.({
      statusCode: 200,
      data: envelope({
        id: 'usr_b',
        nickname: '会话乙',
        avatarAssetId: 'ast_b',
        status: 'ACTIVE',
        createdAt: '2026-11-26T08:00:00.000Z'
      })
    })
    await second

    expect(getAccessToken()).toBe('token-b')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.id).toBe('usr_b')
    expect(store.profile?.displayName).toBe('会话乙')

    firstMe.success?.({
      statusCode: 200,
      data: envelope({
        id: 'usr_a',
        nickname: '会话甲',
        avatarAssetId: null,
        status: 'ACTIVE',
        createdAt: '2026-11-26T06:00:00.000Z'
      })
    })
    await expect(first).rejects.toMatchObject({
      code: 'LOGIN_CANCELLED',
      userMessage: '登录已取消'
    })
    expect(getAccessToken()).toBe('token-b')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.id).toBe('usr_b')
    expect(store.profile?.displayName).toBe('会话乙')
  })

  it('旧登录任务结束时不会清除仍在进行的新登录任务', async (): Promise<void> => {
    const store = useUserStore()
    const captured = captureRequests()
    const first = login({ username: 'Flora', password: 'Flora@2026' })
    const firstCall = await captured.next()

    await store.logout()
    const second = login({ username: 'Moss', password: 'Moss@2026' })
    expect(second).not.toBe(first)
    const secondCall = await captured.next()

    firstCall.success?.({
      statusCode: 200,
      data: envelope(loginData('old-token'))
    })
    await expect(first).rejects.toMatchObject({
      code: 'LOGIN_CANCELLED',
      userMessage: '登录已取消'
    })

    const third = login({ username: 'Moss', password: 'Moss@2026' })
    expect(third).toBe(second)
    expect(getCapturedRequests().filter((call) => call.url.includes('/auth/login'))).toHaveLength(2)

    secondCall.success?.({
      statusCode: 200,
      data: envelope(loginData('new-token'))
    })
    const meCall = await captured.next()
    meCall.success?.({
      statusCode: 200,
      data: envelope(confirmedUser)
    })
    await second
    expect(getAccessToken()).toBe('new-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
  })
})
