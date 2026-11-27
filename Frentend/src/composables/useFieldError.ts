import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'

interface FieldError {
  error: ComputedRef<string>
  visibleError: ComputedRef<string>
  touch: () => void
  reveal: () => void
}

export function useFieldError(validate: () => string): FieldError {
  const touched = ref(false)
  const revealed = ref(false)
  const error = computed((): string => validate())
  const visibleError = computed((): string => {
    if (!touched.value && !revealed.value) {
      return ''
    }
    return error.value
  })

  function touch(): void {
    touched.value = true
  }

  function reveal(): void {
    revealed.value = true
  }

  return {
    error,
    visibleError,
    touch,
    reveal
  }
}
