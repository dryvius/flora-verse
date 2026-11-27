import { STORAGE_KEYS } from '@/constants/storage-keys'
import { AuthStatus } from '@/enums/auth-status'
import { useUserStore } from '@/stores/user-store'
import { writeStorage } from '@/utils/storage'

export const LOGIN_REQUIRED_MESSAGE = '请先登录'

export function hasAuthenticatedSession(): boolean {
  return useUserStore().authStatus === AuthStatus.Authenticated
}

export function isStoredPrivateTabs(stored: unknown): boolean {
  return stored === true
}

export function persistPrivateTabVisibility(): void {
  writeStorage(STORAGE_KEYS.PRIVATE_TABS, hasAuthenticatedSession())
}
