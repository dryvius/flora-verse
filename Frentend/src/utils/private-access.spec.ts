import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { AuthStatus } from '@/enums/auth-status'
import { useUserStore } from '@/stores/user-store'
import { resetUniMock } from '@/test/uni-mock'
import { readStorage } from '@/utils/storage'
import { isStoredPrivateTabs, persistPrivateTabVisibility } from '@/utils/private-access'

describe('底部导航登录态', () => {
  beforeEach((): void => {
    resetUniMock()
    setActivePinia(createPinia())
  })

  it('未登录时不记录私有导航', (): void => {
    const store = useUserStore()
    store.authStatus = AuthStatus.Guest

    persistPrivateTabVisibility()

    expect(readStorage(STORAGE_KEYS.PRIVATE_TABS)).toBe(false)
    expect(isStoredPrivateTabs(false)).toBe(false)
    expect(isStoredPrivateTabs('')).toBe(false)
    expect(isStoredPrivateTabs(null)).toBe(false)
  })

  it('已登录时记录私有导航', (): void => {
    const store = useUserStore()
    store.authStatus = AuthStatus.Authenticated

    persistPrivateTabVisibility()

    expect(readStorage(STORAGE_KEYS.PRIVATE_TABS)).toBe(true)
    expect(isStoredPrivateTabs(true)).toBe(true)
  })
})
