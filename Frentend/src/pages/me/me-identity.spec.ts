import { createPinia, setActivePinia } from 'pinia'
import type { Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthState } from '@/composables/useAuthState'
import { AuthStatus } from '@/enums/auth-status'
import {
  ME_IDENTITY_COPY,
  MeIdentityView,
  avatarGlyph,
  presentMeIdentity,
  resolveAuthenticatedDisplayName,
  retryMeIdentity,
  shouldLoadMeStats
} from '@/pages/me/me-identity'
import type { MeIdentityPresentation, RetryMeIdentityOptions } from '@/pages/me/me-identity'
import { getUserStats } from '@/services/user-service'
import { useUserStore } from '@/stores/user-store'
import type { BackendUserProfile } from '@/types/auth'
import { resetUniMock, setRequestHandler } from '@/test/uni-mock'
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

function failRequests(): void {
  setRequestHandler((options): void => {
    options.fail?.({ errMsg: 'request:fail' })
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
    requestId: 'req_me_identity'
  }
}

function viewFromStore(retrying = false): MeIdentityPresentation {
  const auth = useAuthState()
  return presentMeIdentity({
    authStatus: auth.authStatus.value,
    bootstrapped: auth.bootstrapped.value,
    retrying
  })
}

function createRetry(bootstrap: () => Promise<void>): {
  retrying: { value: boolean }
  message: { value: string }
  run: () => Promise<void>
} {
  const retrying = { value: false }
  const message = { value: '' }
  const options: RetryMeIdentityOptions = {
    isRetrying: (): boolean => retrying.value,
    setRetrying: (value: boolean): void => {
      retrying.value = value
    },
    setMessage: (value: string): void => {
      message.value = value
    },
    bootstrap
  }
  return {
    retrying,
    message,
    run: (): Promise<void> => retryMeIdentity(options)
  }
}

describe('我的页面身份展示', () => {
  beforeEach((): void => {
    vi.unstubAllEnvs()
    resetUniMock()
    setActivePinia(createPinia())
  })

  it('初始 Guest 且尚未完成 bootstrap 时不展示已确认游客', (): void => {
    const store = useUserStore()

    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(false)

    const view = viewFromStore()
    expect(view.view).toBe(MeIdentityView.Loading)
    expect(view.showConfirmedGuest).toBe(false)
    expect(view.showLogin).toBe(false)
  })

  it('bootstrap 成功且没有 Token 时展示游客登录入口', async (): Promise<void> => {
    clearAccessToken()
    const store = useUserStore()

    await store.bootstrap()

    const view = viewFromStore()
    expect(store.authStatus).toBe(AuthStatus.Guest)
    expect(store.bootstrapped).toBe(true)
    expect(view.showConfirmedGuest).toBe(true)
    expect(view.showLogin).toBe(true)
    expect(ME_IDENTITY_COPY.guestTitle).toBe('游客')
    expect(ME_IDENTITY_COPY.loginAction).toBe('登录')
    expect(store.profile?.displayName).toBe('摘星重现')
  })

  it('只有已认证身份才读取收藏统计', (): void => {
    expect(shouldLoadMeStats(AuthStatus.Authenticated)).toBe(true)
    expect(shouldLoadMeStats(AuthStatus.Guest)).toBe(false)
    expect(shouldLoadMeStats(AuthStatus.Bootstrapping)).toBe(false)
    expect(shouldLoadMeStats(AuthStatus.Unavailable)).toBe(false)
  })

  it('已认证时展示 Store.profile 中的昵称', async (): Promise<void> => {
    setAccessToken('live-token')
    respond(200, currentUserBody())
    const store = useUserStore()

    await store.bootstrap()

    const auth = useAuthState()
    const view = viewFromStore()
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(view.showAuthenticatedName).toBe(true)
    expect(resolveAuthenticatedDisplayName(auth.profile.value)).toBe('星辰')
    expect(avatarGlyph(resolveAuthenticatedDisplayName(auth.profile.value))).toBe('星')
  })

  it('profile 为空时不会发生运行时异常', (): void => {
    const store = useUserStore()
    store.authStatus = AuthStatus.Authenticated
    store.profile = null

    const view = viewFromStore()
    expect(view.showAuthenticatedName).toBe(true)
    expect(resolveAuthenticatedDisplayName(store.profile)).toBe(ME_IDENTITY_COPY.fallbackName)
    expect(avatarGlyph(resolveAuthenticatedDisplayName(null))).toBe('旅')
    expect(avatarGlyph('')).toBe('旅')
  })

  it('Unavailable 时展示重试入口', async (): Promise<void> => {
    setAccessToken('keep-me')
    failRequests()
    const store = useUserStore()

    await expect(store.bootstrap()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })

    const view = viewFromStore()
    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(view.view).toBe(MeIdentityView.Unavailable)
    expect(view.showRetry).toBe(true)
    expect(view.showLogin).toBe(false)
    expect(view.showConfirmedGuest).toBe(false)
    expect(ME_IDENTITY_COPY.retryAction).toBe('重试')
  })

  it('点击重试会调用 bootstrap，进行中的重复点击不会再次调用', async (): Promise<void> => {
    const store = useUserStore()
    let releaseBootstrap: () => void = (): void => undefined
    const pending = new Promise<void>((resolve: () => void) => {
      releaseBootstrap = resolve
    })
    const bootstrap = vi.spyOn(store, 'bootstrap').mockReturnValue(pending)
    const retry = createRetry((): Promise<void> => store.bootstrap())

    const first = retry.run()
    const second = retry.run()
    expect(bootstrap).toHaveBeenCalledTimes(1)
    expect(viewFromStore(retry.retrying.value).view).toBe(MeIdentityView.Loading)

    releaseBootstrap()
    await Promise.all([first, second])
    expect(bootstrap).toHaveBeenCalledTimes(1)
  })

  it('重试成功后切换为 Authenticated', async (): Promise<void> => {
    setAccessToken('keep-me')
    failRequests()
    const store = useUserStore()
    await expect(store.bootstrap()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    expect(viewFromStore().view).toBe(MeIdentityView.Unavailable)

    respond(200, currentUserBody())
    const retry = createRetry((): Promise<void> => store.bootstrap())
    await retry.run()

    expect(store.authStatus).toBe(AuthStatus.Authenticated)
    expect(store.profile?.displayName).toBe('星辰')
    expect(viewFromStore().showAuthenticatedName).toBe(true)
    expect(viewFromStore().showRetry).toBe(false)
    expect(retry.message.value).toBe('')
  })

  it('重试失败后仍然保持 Unavailable，且不清除 Token', async (): Promise<void> => {
    setAccessToken('keep-me')
    failRequests()
    const store = useUserStore()
    await expect(store.bootstrap()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })

    const retry = createRetry((): Promise<void> => store.bootstrap())
    await retry.run()

    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(store.bootstrapped).toBe(false)
    expect(store.profile).toBeNull()
    expect(getAccessToken()).toBe('keep-me')
    expect(viewFromStore().view).toBe(MeIdentityView.Unavailable)
    expect(viewFromStore().showConfirmedGuest).toBe(false)
    expect(retry.message.value.length).toBeGreaterThan(0)
  })

  it('身份不可用时统计模块仍按原服务返回', async (): Promise<void> => {
    setAccessToken('keep-me')
    failRequests()
    const store = useUserStore()
    await expect(store.bootstrap()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })

    const before = await getUserStats()
    const retry = createRetry((): Promise<void> => store.bootstrap())
    await retry.run()
    const after = await getUserStats()

    expect(after).toEqual(before)
    expect(after.discoveredSpeciesCount).toEqual(expect.any(Number))
    expect(after.instanceCount).toEqual(expect.any(Number))
    expect(after.successfulCaptureCount).toEqual(expect.any(Number))
    expect(after.totalCombatPower).toEqual(expect.any(Number))
    expect(store.authStatus).toBe(AuthStatus.Unavailable)
    expect(getAccessToken()).toBe('keep-me')
  })

  it('只读认证状态跟随 Store，且不能从 Composable 改写', (): void => {
    const store = useUserStore()
    const auth = useAuthState()

    expect(auth).not.toHaveProperty('bootstrap')
    expect(auth.authStatus.value).toBe(AuthStatus.Guest)
    expect(auth.bootstrapped.value).toBe(false)
    expect(auth.profile.value).toBeNull()

    store.authStatus = AuthStatus.Authenticated
    store.bootstrapped = true
    expect(auth.authStatus.value).toBe(AuthStatus.Authenticated)
    expect(auth.bootstrapped.value).toBe(true)

    const warn = vi.spyOn(console, 'warn').mockImplementation((): void => undefined)
    const writableStatus = auth.authStatus as Ref<AuthStatus>
    writableStatus.value = AuthStatus.Guest
    warn.mockRestore()
    expect(store.authStatus).toBe(AuthStatus.Authenticated)
  })
})
