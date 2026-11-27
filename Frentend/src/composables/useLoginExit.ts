import { onUnload } from '@dcloudio/uni-app'
import { watch } from 'vue'
import { useAuthState } from '@/composables/useAuthState'
import { AuthStatus } from '@/enums/auth-status'
import { prepareLoginReturn, releaseLoginEntry, returnFromLogin } from '@/utils/navigation'

export function useLoginExit(): void {
  prepareLoginReturn()
  const { authStatus } = useAuthState()
  watch(
    authStatus,
    (status: AuthStatus): void => {
      if (status !== AuthStatus.Authenticated) {
        return
      }
      returnFromLogin()
    },
    { immediate: true }
  )
  onUnload((): void => {
    releaseLoginEntry()
  })
}
