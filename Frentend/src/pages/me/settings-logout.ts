import { AuthStatus } from '@/enums/auth-status'
import { toUserMessage } from '@/utils/business-error'

export const LOGOUT_COPY = {
  action: '退出登录',
  title: '退出登录',
  content: '确定要退出当前账号吗？',
  confirm: '退出登录',
  cancel: '取消',
  failed: '退出登录未能完成，请稍后再试'
} as const

interface LogoutConfirmResult {
  confirm?: boolean
}

interface LogoutModalOptions {
  title: string
  content: string
  confirmText: string
  cancelText: string
  success?: (result: LogoutConfirmResult) => void
  fail?: () => void
}

export interface LogoutRequestOptions {
  confirm: () => Promise<boolean>
  logout: () => Promise<void>
  returnToMe: () => void
  isLoggingOut: () => boolean
  setLoggingOut: (value: boolean) => void
  onError: (message: string) => void
}

export function canShowLogout(status: AuthStatus): boolean {
  return status === AuthStatus.Authenticated
}

export function confirmLogout(): Promise<boolean> {
  return new Promise((resolve) => {
    const modal: LogoutModalOptions = {
      title: LOGOUT_COPY.title,
      content: LOGOUT_COPY.content,
      confirmText: LOGOUT_COPY.confirm,
      cancelText: LOGOUT_COPY.cancel,
      success: (result: LogoutConfirmResult): void => {
        resolve(result.confirm === true)
      },
      fail: (): void => {
        resolve(false)
      }
    }
    uni.showModal(modal)
  })
}

export async function requestLogout(options: LogoutRequestOptions): Promise<void> {
  if (options.isLoggingOut()) {
    return
  }
  options.setLoggingOut(true)
  try {
    const confirmed = await options.confirm()
    if (!confirmed) {
      return
    }
    await options.logout()
    options.returnToMe()
  } catch (error) {
    options.onError(toUserMessage(error, LOGOUT_COPY.failed))
  } finally {
    options.setLoggingOut(false)
  }
}
