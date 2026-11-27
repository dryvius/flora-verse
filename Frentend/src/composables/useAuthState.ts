import { storeToRefs } from 'pinia'
import { readonly } from 'vue'
import type { DeepReadonly, Ref } from 'vue'
import { useUserStore } from '@/stores/user-store'
import type { AuthStatus } from '@/enums/auth-status'
import type { UserProfile } from '@/types/user'

export interface AuthState {
  authStatus: DeepReadonly<Ref<AuthStatus>>
  bootstrapped: DeepReadonly<Ref<boolean>>
  profile: DeepReadonly<Ref<UserProfile | null>>
}

export function useAuthState(): AuthState {
  const store = useUserStore()
  const state = storeToRefs(store)
  return {
    authStatus: readonly(state.authStatus),
    bootstrapped: readonly(state.bootstrapped),
    profile: readonly(state.profile)
  }
}
