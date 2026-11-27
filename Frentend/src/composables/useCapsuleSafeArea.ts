import { onMounted, ref } from 'vue'

interface CapsuleSafeArea {
  paddingTop: ReturnType<typeof ref<number>>
}

export function useCapsuleSafeArea(): CapsuleSafeArea {
  const paddingTop = ref(0)

  onMounted((): void => {
    try {
      const rect = uni.getMenuButtonBoundingClientRect()
      if (!rect || rect.bottom <= 0) {
        return
      }
      paddingTop.value = rect.bottom + 8
    } catch {
      paddingTop.value = 0
    }
  })

  return {
    paddingTop
  }
}
