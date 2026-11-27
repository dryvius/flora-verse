import { beforeEach, describe, expect, it } from 'vitest'
import { AuthStatus } from '@/enums/auth-status'
import { LOGOUT_COPY, canShowLogout, confirmLogout, requestLogout } from '@/pages/me/settings-logout'
import type { LogoutRequestOptions } from '@/pages/me/settings-logout'
import { resetUniMock } from '@/test/uni-mock'
import { BusinessError } from '@/utils/business-error'

interface ModalResult {
  confirm?: boolean
  cancel?: boolean
}

interface ModalOptions {
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  success?: (result: ModalResult) => void
  fail?: () => void
}

interface LogoutProbe {
  confirmations: number
  logouts: number
  returns: number
  message: string
  loggingOut: boolean
  releaseLogout: () => void
  options: LogoutRequestOptions
}

function createProbe(confirmResult: boolean | Promise<boolean>): LogoutProbe {
  const probe: LogoutProbe = {
    confirmations: 0,
    logouts: 0,
    returns: 0,
    message: '',
    loggingOut: false,
    releaseLogout: (): void => undefined,
    options: {
      confirm: (): Promise<boolean> => Promise.resolve(false),
      logout: (): Promise<void> => Promise.resolve(),
      returnToMe: (): void => undefined,
      isLoggingOut: (): boolean => false,
      setLoggingOut: (): void => undefined,
      onError: (): void => undefined
    }
  }
  probe.options = {
    confirm: (): Promise<boolean> => {
      probe.confirmations += 1
      return Promise.resolve(confirmResult)
    },
    logout: (): Promise<void> => {
      probe.logouts += 1
      return new Promise((resolve) => {
        probe.releaseLogout = resolve
      })
    },
    returnToMe: (): void => {
      probe.returns += 1
    },
    isLoggingOut: (): boolean => probe.loggingOut,
    setLoggingOut: (value: boolean): void => {
      probe.loggingOut = value
    },
    onError: (message: string): void => {
      probe.message = message
    }
  }
  return probe
}

describe('设置页退出登录', () => {
  beforeEach((): void => {
    resetUniMock()
  })

  it('Authenticated 状态显示退出登录入口', (): void => {
    expect(canShowLogout(AuthStatus.Authenticated)).toBe(true)
  })

  it('Guest、Bootstrapping、Unavailable 不显示退出登录入口', (): void => {
    expect(canShowLogout(AuthStatus.Guest)).toBe(false)
    expect(canShowLogout(AuthStatus.Bootstrapping)).toBe(false)
    expect(canShowLogout(AuthStatus.Unavailable)).toBe(false)
  })

  it('点击退出后显示确认弹窗，取消时不调用 logout', async (): Promise<void> => {
    let modal: ModalOptions | undefined
    const uniApi = (globalThis as unknown as { uni: { showModal: (options: ModalOptions) => void } }).uni
    uniApi.showModal = (options: ModalOptions): void => {
      modal = options
    }
    const pending = confirmLogout()

    expect(modal?.title).toBe(LOGOUT_COPY.title)
    expect(modal?.content).toBe(LOGOUT_COPY.content)
    expect(modal?.confirmText).toBe(LOGOUT_COPY.confirm)
    expect(modal?.cancelText).toBe(LOGOUT_COPY.cancel)

    modal?.success?.({ confirm: false, cancel: true })
    await expect(pending).resolves.toBe(false)

    const probe = createProbe(false)
    await requestLogout(probe.options)
    expect(probe.confirmations).toBe(1)
    expect(probe.logouts).toBe(0)
    expect(probe.returns).toBe(0)
    expect(probe.loggingOut).toBe(false)
  })

  it('用户确认后调用 logout，成功后返回我的', async (): Promise<void> => {
    const probe = createProbe(true)
    const pending = requestLogout(probe.options)
    await Promise.resolve()
    expect(probe.confirmations).toBe(1)
    expect(probe.logouts).toBe(1)
    expect(probe.returns).toBe(0)
    probe.releaseLogout()
    await pending
    expect(probe.returns).toBe(1)
    expect(probe.loggingOut).toBe(false)
    expect(probe.message).toBe('')
  })

  it('logout 进行中重复点击，不重复执行', async (): Promise<void> => {
    const probe = createProbe(true)
    const first = requestLogout(probe.options)
    const second = requestLogout(probe.options)
    await Promise.resolve()

    expect(probe.confirmations).toBe(1)
    expect(probe.logouts).toBe(1)
    expect(probe.loggingOut).toBe(true)

    probe.releaseLogout()
    await first
    await second
    expect(probe.logouts).toBe(1)
    expect(probe.returns).toBe(1)
    expect(probe.loggingOut).toBe(false)
  })

  it('logout 失败时不返回我的，并保留可展示的错误', async (): Promise<void> => {
    const probe = createProbe(true)
    probe.options.logout = (): Promise<void> => {
      probe.logouts += 1
      return Promise.reject(new BusinessError('LOGOUT_FAILED', LOGOUT_COPY.failed))
    }
    await requestLogout(probe.options)
    expect(probe.logouts).toBe(1)
    expect(probe.returns).toBe(0)
    expect(probe.message).toBe(LOGOUT_COPY.failed)
    expect(probe.loggingOut).toBe(false)
  })
})
