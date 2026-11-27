import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { AuthStatus } from '@/enums/auth-status'
import { getCurrentUser } from '@/services/user-service'
import type { UserProfile } from '@/types/user'
import { BusinessError } from '@/utils/business-error'
import { isSessionInvalidError } from '@/utils/session-error'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/utils/token-storage'

const LOGOUT_FAILED = 'LOGOUT_FAILED'
const LOGOUT_FAILED_MESSAGE = '退出登录未能完成，请稍后再试'

interface UserStore {
  profile: Ref<UserProfile | null>
  bootstrapped: Ref<boolean>
  authStatus: Ref<AuthStatus>
  currentAuthEpoch: () => number
  bootstrap: () => Promise<void>
  confirmSession: (accessToken: string) => Promise<number>
  logout: () => Promise<void>
}

export const useUserStore = defineStore('user', (): UserStore => {
  const profile = ref<UserProfile | null>(null)
  const bootstrapped = ref(false)
  const authStatus = ref<AuthStatus>(AuthStatus.Guest)
  let bootstrapPromise: Promise<void> | null = null
  let authGeneration = 0

  function bootstrap(): Promise<void> {
    if (bootstrapPromise) {
      return bootstrapPromise
    }
    const generation = authGeneration
    const gate: {
      resolve: (value: void) => void
      reject: (reason: unknown) => void
    } = {
      resolve: () => undefined,
      reject: () => undefined
    }
    const pending = new Promise<void>((resolve, reject) => {
      gate.resolve = resolve
      gate.reject = reject
    })
    bootstrapPromise = pending
    void executeBootstrap(generation).then(
      () => {
        gate.resolve()
      },
      (error: unknown) => {
        gate.reject(error)
      }
    )
    void pending.then(
      () => {
        releaseBootstrap(pending)
      },
      () => {
        releaseBootstrap(pending)
      }
    )
    return pending
  }

  function releaseBootstrap(pending: Promise<void>): void {
    if (bootstrapPromise === pending) {
      bootstrapPromise = null
    }
  }

  function isCurrentGeneration(generation: number): boolean {
    return generation === authGeneration
  }

  function invalidateAuthGeneration(): void {
    authGeneration += 1
  }

  async function executeBootstrap(generation: number): Promise<void> {
    authStatus.value = AuthStatus.Bootstrapping
    try {
      const nextProfile = await getCurrentUser()
      if (!isCurrentGeneration(generation)) {
        return
      }
      profile.value = nextProfile
      bootstrapped.value = true
      authStatus.value = getAccessToken() ? AuthStatus.Authenticated : AuthStatus.Guest
    } catch (error) {
      if (!isCurrentGeneration(generation)) {
        return
      }
      if (isSessionInvalidError(error)) {
        await recoverGuestSession(generation)
        return
      }
      profile.value = null
      bootstrapped.value = false
      authStatus.value = getAccessToken() ? AuthStatus.Unavailable : AuthStatus.Guest
      throw error
    }
  }

  async function recoverGuestSession(generation: number): Promise<void> {
    clearAccessToken()
    authStatus.value = AuthStatus.Guest
    profile.value = null
    const mockProfile = await getCurrentUser()
    if (!isCurrentGeneration(generation)) {
      return
    }
    profile.value = mockProfile
    bootstrapped.value = true
    authStatus.value = AuthStatus.Guest
  }

  function currentAuthEpoch(): number {
    return authGeneration
  }

  async function confirmSession(accessToken: string): Promise<number> {
    setAccessToken(accessToken)
    invalidateAuthGeneration()
    const generation = authGeneration
    bootstrapPromise = null
    await bootstrap()
    return generation
  }

  async function logout(): Promise<void> {
    try {
      clearAccessToken()
      if (getAccessToken()) {
        throw new Error(LOGOUT_FAILED)
      }
    } catch {
      throw new BusinessError(LOGOUT_FAILED, LOGOUT_FAILED_MESSAGE)
    }
    invalidateAuthGeneration()
    const generation = authGeneration
    bootstrapPromise = null
    authStatus.value = AuthStatus.Guest
    profile.value = null
    bootstrapped.value = false
    const mockProfile = await getCurrentUser()
    if (!isCurrentGeneration(generation)) {
      return
    }
    profile.value = mockProfile
    bootstrapped.value = true
    authStatus.value = AuthStatus.Guest
  }

  return {
    profile,
    bootstrapped,
    authStatus,
    currentAuthEpoch,
    bootstrap,
    confirmSession,
    logout
  }
})
