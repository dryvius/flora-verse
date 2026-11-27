import { AuthStatus } from '@/enums/auth-status'
import type { UserProfile } from '@/types/user'
import { toUserMessage } from '@/utils/business-error'

export enum MeIdentityView {
  Loading = 'loading',
  Guest = 'guest',
  Authenticated = 'authenticated',
  Unavailable = 'unavailable'
}

export const ME_IDENTITY_COPY = {
  guestTitle: '游客',
  guestHint: '尚未登录',
  loginAction: '登录',
  loadingText: '正在确认身份',
  unavailableTitle: '身份暂时无法确认',
  unavailableHint: '登录凭证仍保留，可以稍后重试',
  retryAction: '重试',
  retryFallback: '身份暂时无法确认，请稍后再试',
  fallbackName: '旅人'
} as const

export interface MeIdentityInput {
  authStatus: AuthStatus
  bootstrapped: boolean
  retrying: boolean
}

export interface MeIdentityPresentation {
  view: MeIdentityView
  showLogin: boolean
  showRetry: boolean
  showConfirmedGuest: boolean
  showAuthenticatedName: boolean
}

export interface RetryMeIdentityOptions {
  isRetrying: () => boolean
  setRetrying: (value: boolean) => void
  setMessage: (value: string) => void
  bootstrap: () => Promise<void>
}

export function presentMeIdentity(input: MeIdentityInput): MeIdentityPresentation {
  const view = resolveMeIdentityView(input)
  return {
    view,
    showLogin: view === MeIdentityView.Guest,
    showRetry: view === MeIdentityView.Unavailable,
    showConfirmedGuest: view === MeIdentityView.Guest,
    showAuthenticatedName: view === MeIdentityView.Authenticated
  }
}

export function shouldLoadMeStats(status: AuthStatus): boolean {
  return status === AuthStatus.Authenticated
}

export function resolveAuthenticatedDisplayName(profile: UserProfile | null): string {
  const name = profile?.displayName?.trim() ?? ''
  if (name.length === 0) {
    return ME_IDENTITY_COPY.fallbackName
  }
  return name
}

export function avatarGlyph(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return ME_IDENTITY_COPY.fallbackName.slice(0, 1)
  }
  return trimmed.slice(0, 1)
}

export async function retryMeIdentity(options: RetryMeIdentityOptions): Promise<void> {
  if (options.isRetrying()) {
    return
  }
  options.setRetrying(true)
  options.setMessage('')
  try {
    await options.bootstrap()
  } catch (error) {
    options.setMessage(toUserMessage(error, ME_IDENTITY_COPY.retryFallback))
  } finally {
    options.setRetrying(false)
  }
}

function resolveMeIdentityView(input: MeIdentityInput): MeIdentityView {
  if (input.retrying || input.authStatus === AuthStatus.Bootstrapping) {
    return MeIdentityView.Loading
  }
  if (input.authStatus === AuthStatus.Unavailable) {
    return MeIdentityView.Unavailable
  }
  if (input.authStatus === AuthStatus.Authenticated) {
    return MeIdentityView.Authenticated
  }
  if (input.authStatus === AuthStatus.Guest && input.bootstrapped) {
    return MeIdentityView.Guest
  }
  return MeIdentityView.Loading
}
