import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_INVALID_ERROR_CODES } from '@/constants/api-contract'
import { DEMO_USER_ID } from '@/constants/app'
import { ERROR_CODES } from '@/constants/error-codes'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { AuthStatus } from '@/enums/auth-status'
import { getMockDb, initMockDatabase } from '@/repositories/mock/store'
import { useUserStore } from '@/stores/user-store'
import type { BackendUserProfile } from '@/types/auth'
import { getCapturedRequests, resetUniMock, setRequestHandler } from '@/test/uni-mock'
import { readStorage, writeStorage } from '@/utils/storage'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/utils/token-storage'

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

function currentUserBody(user: BackendUserProfile = backendUser): {
  code: string
  message: string
  data: BackendUserProfile
  requestId: string
} {
  return {
    code: 'OK',
    message: 'success',
    data: user,
    requestId: 'req_me'
  }
}

interface HeldRequest {
  success?: (result: { statusCode?: number; data?: unknown }) => void
  fail?: (error: { errMsg: string }) => void
}

function holdNextRequest(): Promise<HeldRequest> {
  return new Promise((resolve: (request: HeldRequest) => void) => {
    setRequestHandler((options): void => {
      resolve(options)
    })
  })
}

function captureRequests(): { next: () => Promise<HeldRequest> } {
  const waiting: Array<(request: HeldRequest) => void> = []
  const buffered: HeldRequest[] = []
  setRequestHandler((options): void => {
    const resolve = waiting.shift()
    if (resolve) {
      resolve(options)
      return
    }
    buffered.push(options)
  })
  return {
    next: (): Promise<HeldRequest> => {
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

const freshUser: BackendUserProfile = {
  id: 'usr_fresh',
  nickname: '新登录',
  avatarAssetId: 'ast_fresh',
  status: 'ACTIVE',
  createdAt: '2026-11-26T07:00:00.000Z'
}

describe('UserStore 认证状态', () => {
  beforeEach((): void => {
    vi.unstubAllEnvs()
    resetUniMock()
    setActivePinia(createPinia())
  })

  it('没有 Token 时使用 Mock 用户并保持 guest', async (): Promise<void> => {
    clearAccessToken()
    const store = useUserStore()

    await store.bootstrap()

    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile).toMatchObject({
      id: DEMO_USER_ID,
      displayName: '摘星重现'
    })
    expect(getCapturedRequests()).toHaveLength(0)
  })

  it('有 Token 时请求 Backend 当前用户并映射资料', async (): Promise<void> => {
    setAccessToken('live-token')
    respond(200, currentUserBody())
    const store = useUserStore()

    await store.bootstrap()

    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile).toEqual({
      id: 'usr_real',
      displayName: '星辰',
      avatarKey: '',
      createdAt: '2026-11-26T06:00:00.000Z',
      status: 'ACTIVE',
      avatarAssetId: 'ast_avatar_001'
    })
    expect(store.profile).not.toHaveProperty('accessToken')
    const call = getCapturedRequests()[0]
    expect(call?.method).toBe('GET')
    expect(call?.url).toBe(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/me`)
    expect(call?.header.Authorization).toBe('Bearer live-token')
  })

  it('会话无效时清除 Token 并回到 Mock guest', async (): Promise<void> => {
    const store = useUserStore()

    for (const code of SESSION_INVALID_ERROR_CODES) {
      resetUniMock()
      setAccessToken('stale-token')
      respond(401, {
        code,
        message: code,
        requestId: `req_${code}`
      })

      await store.bootstrap()

      expect(getAccessToken()).toBeNull()
      expect(store.authStatus).toBe(AuthStatus.Guest)
      expect(store.bootstrapped).toBe(true)
      expect(store.profile?.displayName).toBe('摘星重现')
    }
  })

  it('网络异常不清除 Token，并且可以再次初始化', async (): Promise<void> => {
    setAccessToken('keep-me')
    setRequestHandler((options): void => {
      options.fail?.({ errMsg: 'request:fail' })
    })
    const store = useUserStore()

    await expect(store.bootstrap()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    expect(getCapturedRequests()).toHaveLength(1)
    expect(getAccessToken()).toBe('keep-me')
    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(store.bootstrapped).toBe(false)
    expect(store.profile).toBeNull()

    respond(200, currentUserBody())
    await store.bootstrap()

    expect(getCapturedRequests()).toHaveLength(2)
    expect(getAccessToken()).toBe('keep-me')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.displayName).toBe('星辰')
  })

  it('有 Token 且 Base URL 缺失时进入 Unavailable 并保留 Token', async (): Promise<void> => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    setAccessToken('keep-me')
    const store = useUserStore()

    await expect(store.bootstrap()).rejects.toMatchObject({ code: ERROR_CODES.API_BASE_URL_MISSING })

    expect(getAccessToken()).toBe('keep-me')
    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(store.bootstrapped).toBe(false)
    expect(store.profile).toBeNull()
    expect(getCapturedRequests()).toHaveLength(0)
  })

  it('logout 清除会话并保留 Mock 数据库', async (): Promise<void> => {
    await initMockDatabase()
    writeStorage(STORAGE_KEYS.MOCK_DATABASE, getMockDb())
    const before = readStorage(STORAGE_KEYS.MOCK_DATABASE)
    const store = useUserStore()
    respond(200, currentUserBody())

    await store.confirmSession('live-token')
    expect(getAccessToken()).toBe('live-token')
    expect(store.profile).not.toHaveProperty('accessToken')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)

    const epoch = store.currentAuthEpoch()
    await store.logout()

    expect(getAccessToken()).toBeNull()
    expect(readStorage(STORAGE_KEYS.MOCK_DATABASE)).toEqual(before)
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile?.id).toBe(DEMO_USER_ID)
    expect(store.profile?.id).not.toBe('usr_real')
    expect(store.currentAuthEpoch()).toBe(epoch + 1)
  })

  it('Token 清理失败时不能错误地报告退出成功', async (): Promise<void> => {
    respond(200, currentUserBody())
    const store = useUserStore()
    await store.confirmSession('live-token')
    const epoch = store.currentAuthEpoch()
    const uniApi = (globalThis as unknown as { uni: { removeStorageSync: (key: string) => void } }).uni
    const original = uniApi.removeStorageSync.bind(uniApi)
    uniApi.removeStorageSync = (): void => {
      throw new Error('storage locked')
    }

    try {
      await expect(store.logout()).rejects.toMatchObject({
        code: 'LOGOUT_FAILED',
        userMessage: '退出登录未能完成，请稍后再试'
      })
      expect(getAccessToken()).toBe('live-token')
      expect(store.authStatus).toBe(AuthStatus.Authenticated)
      expect(store.bootstrapped).toBe(true)
      expect(store.profile?.id).toBe('usr_real')
      expect(store.currentAuthEpoch()).toBe(epoch)
    } finally {
      uniApi.removeStorageSync = original
    }

    uniApi.removeStorageSync = (): void => undefined
    try {
      await expect(store.logout()).rejects.toMatchObject({
        code: 'LOGOUT_FAILED',
        userMessage: '退出登录未能完成，请稍后再试'
      })
      expect(getAccessToken()).toBe('live-token')
      expect(store.authStatus).toBe(AuthStatus.Authenticated)
      expect(store.profile?.id).toBe('usr_real')
      expect(store.currentAuthEpoch()).toBe(epoch)
    } finally {
      uniApi.removeStorageSync = original
    }
  })

  it('Token 删除后读取验证失败时，退出登录应返回统一业务错误', async (): Promise<void> => {
    respond(200, currentUserBody())
    const store = useUserStore()
    await store.confirmSession('live-token')
    const token = getAccessToken()
    const profile = store.profile
    const epoch = store.currentAuthEpoch()
    expect(token).toBe('live-token')
    expect(profile?.id).toBe('usr_real')
    const uniApi = (
      globalThis as unknown as {
        uni: {
          removeStorageSync: (key: string) => void
          getStorageSync: (key: string) => unknown
        }
      }
    ).uni
    const originalRemove = uniApi.removeStorageSync.bind(uniApi)
    const originalRead = uniApi.getStorageSync.bind(uniApi)
    uniApi.removeStorageSync = (key: string): void => {
      originalRemove(key)
    }
    uniApi.getStorageSync = (): never => {
      throw new Error('storage read failed')
    }

    try {
      await expect(store.logout()).rejects.toMatchObject({
        code: 'LOGOUT_FAILED',
        userMessage: '退出登录未能完成，请稍后再试'
      })
      expect(store.profile).toBe(profile)
      expect(store.profile?.id).toBe('usr_real')
      expect(store.authStatus).toBe(AuthStatus.Authenticated)
      expect(store.bootstrapped).toBe(true)
      expect(store.currentAuthEpoch()).toBe(epoch)
    } finally {
      uniApi.removeStorageSync = originalRemove
      uniApi.getStorageSync = originalRead
    }
  })

  it('并发 bootstrap 只发出一次当前用户请求', async (): Promise<void> => {
    setAccessToken('live-token')
    let release: (() => void) | undefined
    setRequestHandler((options): void => {
      release = (): void => {
        options.success?.({
          statusCode: 200,
          data: currentUserBody()
        })
      }
    })
    const store = useUserStore()

    const first = store.bootstrap()
    const second = store.bootstrap()

    expect(getCapturedRequests()).toHaveLength(1)
    expect(store.authStatus).toBe(AuthStatus.Bootstrapping)
    await Promise.resolve()
    release?.()
    await Promise.all([first, second])

    expect(getCapturedRequests()).toHaveLength(1)
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
  })

  it('进行中的 bootstrap 成功返回时不覆盖新的登录资料', async (): Promise<void> => {
    setAccessToken('old-token')
    const captured = captureRequests()
    const store = useUserStore()
    const pending = store.bootstrap()
    const stale = await captured.next()
    const confirming = store.confirmSession('fresh-token')
    const fresh = await captured.next()

    stale.success?.({ statusCode: 200, data: currentUserBody(backendUser) })
    fresh.success?.({ statusCode: 200, data: currentUserBody(freshUser) })
    await Promise.all([pending, confirming])

    expect(getAccessToken()).toBe('fresh-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile?.id).toBe('usr_fresh')
    expect(store.profile?.displayName).toBe('新登录')
  })

  it('进行中的 bootstrap 成功返回时不恢复已退出的 Backend 用户', async (): Promise<void> => {
    setAccessToken('old-token')
    const opened = holdNextRequest()
    const store = useUserStore()
    const pending = store.bootstrap()
    const request = await opened

    const loggedOut = store.logout()
    request.success?.({ statusCode: 200, data: currentUserBody(backendUser) })
    await Promise.all([pending, loggedOut])

    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile?.id).toBe(DEMO_USER_ID)
  })

  it('过期的 Session 无效响应不清除后来登录写入的 Token', async (): Promise<void> => {
    setAccessToken('old-token')
    const opened = holdNextRequest()
    const store = useUserStore()
    const pending = store.bootstrap()
    const request = await opened

    const captured = captureRequests()
    const confirming = store.confirmSession('fresh-token')
    const fresh = await captured.next()
    request.success?.({
      statusCode: 401,
      data: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
        requestId: 'req_stale'
      }
    })
    fresh.success?.({ statusCode: 200, data: currentUserBody(freshUser) })
    await Promise.all([pending, confirming])

    expect(getAccessToken()).toBe('fresh-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.id).toBe('usr_fresh')
  })

  it('过期的网络错误不覆盖后来的登录或退出状态', async (): Promise<void> => {
    setAccessToken('old-token')
    const loginOpened = holdNextRequest()
    const loginStore = useUserStore()
    const loginPending = loginStore.bootstrap()
    const loginRequest = await loginOpened

    const captured = captureRequests()
    const confirming = loginStore.confirmSession('fresh-token')
    const fresh = await captured.next()
    loginRequest.fail?.({ errMsg: 'request:fail' })
    fresh.success?.({ statusCode: 200, data: currentUserBody(freshUser) })
    await Promise.all([loginPending, confirming])

    expect(getAccessToken()).toBe('fresh-token')
    expect(loginStore.authStatus).toBe(AuthStatus.Authenticated)
    expect(loginStore.profile?.id).toBe('usr_fresh')

    setActivePinia(createPinia())
    resetUniMock()
    setAccessToken('old-token')
    const logoutOpened = holdNextRequest()
    const logoutStore = useUserStore()
    const logoutPending = logoutStore.bootstrap()
    const logoutRequest = await logoutOpened

    const loggedOut = logoutStore.logout()
    logoutRequest.fail?.({ errMsg: 'request:fail' })
    await Promise.all([logoutPending, loggedOut])

    expect(getAccessToken()).toBeNull()
    expect(logoutStore.authStatus).toBe(AuthStatus.Guest)
    expect(logoutStore.profile?.id).toBe(DEMO_USER_ID)
  })

  it('退出加载 Mock 用户期间重新登录时保留新登录状态', async (): Promise<void> => {
    respond(200, currentUserBody(backendUser))
    const store = useUserStore()
    await store.confirmSession('old-token')
    respond(200, currentUserBody(freshUser))

    const loggedOut = store.logout()
    const relogin = store.confirmSession('fresh-token')
    await Promise.all([loggedOut, relogin])

    expect(getAccessToken()).toBe('fresh-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile).toEqual({
      id: 'usr_fresh',
      displayName: '新登录',
      avatarKey: '',
      createdAt: freshUser.createdAt,
      status: 'ACTIVE',
      avatarAssetId: 'ast_fresh'
    })
  })

  it('bootstrap 期间 logout 后可以重新 bootstrap', async (): Promise<void> => {
    setAccessToken('old-token')
    const captured = captureRequests()
    const store = useUserStore()
    const pending = store.bootstrap()
    const stale = await captured.next()
    const loggedOut = store.logout()
    const again = store.bootstrap()

    expect(again).not.toBe(pending)
    stale.success?.({ statusCode: 200, data: currentUserBody(backendUser) })
    await Promise.all([pending, loggedOut, again])

    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile?.id).toBe(DEMO_USER_ID)

    setAccessToken('fresh-token')
    respond(200, currentUserBody(freshUser))
    await store.bootstrap()

    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.displayName).toBe('新登录')
  })

  it('bootstrap 期间 confirmSession 以新的身份确认为准', async (): Promise<void> => {
    setAccessToken('old-token')
    const captured = captureRequests()
    const store = useUserStore()
    const pending = store.bootstrap()
    const stale = await captured.next()
    const confirming = store.confirmSession('fresh-token')
    const fresh = await captured.next()

    stale.success?.({ statusCode: 200, data: currentUserBody(backendUser) })
    fresh.success?.({ statusCode: 200, data: currentUserBody(freshUser) })
    await Promise.all([pending, confirming])

    expect(getAccessToken()).toBe('fresh-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.id).toBe('usr_fresh')
  })

  it('confirmSession 期间 logout 后旧身份确认不能登录', async (): Promise<void> => {
    const captured = captureRequests()
    const store = useUserStore()
    const confirming = store.confirmSession('fresh-token')
    const me = await captured.next()
    const loggedOut = store.logout()

    me.success?.({ statusCode: 200, data: currentUserBody(freshUser) })
    await Promise.all([confirming, loggedOut])

    expect(getAccessToken()).toBeNull()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(store.profile?.id).toBe(DEMO_USER_ID)
  })

  it('Token 写入失败时不进入 Authenticated 也不请求身份', async (): Promise<void> => {
    const store = useUserStore()
    const uniApi = (globalThis as unknown as { uni: { setStorageSync: (key: string, value: unknown) => void } }).uni
    const original = uniApi.setStorageSync.bind(uniApi)
    uniApi.setStorageSync = (): void => {
      throw new Error('quota exceeded')
    }

    try {
      await expect(store.confirmSession('live-token')).rejects.toThrow('quota exceeded')
      expect(getAccessToken()).toBeNull()
      expect(store.authStatus).toBe(AuthStatus.Guest)
      expect(store.profile).toBeNull()
      expect(store.bootstrapped).toBe(false)
      expect(getCapturedRequests()).toHaveLength(0)
    } finally {
      uniApi.setStorageSync = original
    }

    respond(200, currentUserBody())
    await store.confirmSession('live-token')
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(getAccessToken()).toBe('live-token')
  })

  it('不再提供绕过身份确认的 applyLoginResult', (): void => {
    const store = useUserStore()
    expect(store).not.toHaveProperty('applyLoginResult')
  })
})
