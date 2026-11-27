import { computed, onUnmounted, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { PageStatus } from '@/enums/page-status'

const LOADING_REVEAL_DELAY_MS = 200

interface PageStateApi {
  status: Ref<PageStatus>
  errorMessage: Ref<string>
  isLoading: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  isEmpty: ComputedRef<boolean>
  isSuccess: ComputedRef<boolean>
  prepareLoad: () => number
  isCurrentLoad: (ticket: number) => boolean
  setLoading: () => void
  setSuccess: (ticket?: number) => void
  setEmpty: (ticket?: number) => void
  setError: (message: string, ticket?: number) => void
}

export function usePageState(): PageStateApi {
  const status = ref<PageStatus>(PageStatus.Idle)
  const errorMessage = ref('')
  let generation = 0
  let loadingTimer = 0

  const isLoading = computed((): boolean => status.value === PageStatus.Loading)
  const isError = computed((): boolean => status.value === PageStatus.Error)
  const isEmpty = computed((): boolean => status.value === PageStatus.Empty)
  const isSuccess = computed((): boolean => status.value === PageStatus.Success)

  function clearLoadingTimer(): void {
    if (!loadingTimer) {
      return
    }
    clearTimeout(loadingTimer)
    loadingTimer = 0
  }

  function isCurrent(ticket?: number): boolean {
    return ticket === undefined || ticket === generation
  }

  function isCurrentLoad(ticket: number): boolean {
    return ticket === generation
  }

  function prepareLoad(): number {
    generation += 1
    const ticket = generation
    clearLoadingTimer()
    const hasVisibleContent = status.value === PageStatus.Success || status.value === PageStatus.Empty
    if (hasVisibleContent) {
      return ticket
    }
    loadingTimer = setTimeout((): void => {
      if (ticket !== generation) {
        return
      }
      status.value = PageStatus.Loading
      errorMessage.value = ''
    }, LOADING_REVEAL_DELAY_MS) as unknown as number
    return ticket
  }

  function setLoading(): void {
    clearLoadingTimer()
    generation += 1
    status.value = PageStatus.Loading
    errorMessage.value = ''
  }

  function setSuccess(ticket?: number): void {
    if (!isCurrent(ticket)) {
      return
    }
    clearLoadingTimer()
    status.value = PageStatus.Success
    errorMessage.value = ''
  }

  function setEmpty(ticket?: number): void {
    if (!isCurrent(ticket)) {
      return
    }
    clearLoadingTimer()
    status.value = PageStatus.Empty
    errorMessage.value = ''
  }

  function setError(message: string, ticket?: number): void {
    if (!isCurrent(ticket)) {
      return
    }
    clearLoadingTimer()
    status.value = PageStatus.Error
    errorMessage.value = message
  }

  onUnmounted((): void => {
    clearLoadingTimer()
  })

  return {
    status,
    errorMessage,
    isLoading,
    isError,
    isEmpty,
    isSuccess,
    prepareLoad,
    isCurrentLoad,
    setLoading,
    setSuccess,
    setEmpty,
    setError
  }
}
