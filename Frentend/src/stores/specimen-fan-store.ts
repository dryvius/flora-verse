import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InstanceCard } from '@/types/views'

export const useSpecimenFanStore = defineStore('specimen-fan', () => {
  const isOpen = ref(false)
  const items = ref<InstanceCard[]>([])
  const focusIndex = ref(0)
  const openedAt = ref(0)

  function open(nextItems: InstanceCard[]): void {
    items.value = nextItems.slice(0, 3)
    focusIndex.value = 0
    isOpen.value = items.value.length > 1
    openedAt.value = Date.now()
  }

  function close(): void {
    isOpen.value = false
    items.value = []
    focusIndex.value = 0
    openedAt.value = 0
  }

  function setFocus(index: number): void {
    const last = items.value.length - 1
    if (index < 0 || index > last) {
      return
    }
    focusIndex.value = index
  }

  function isOpening(): boolean {
    return Date.now() - openedAt.value < 360
  }

  return {
    isOpen,
    items,
    focusIndex,
    open,
    close,
    setFocus,
    isOpening
  }
})
