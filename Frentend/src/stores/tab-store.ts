import { defineStore } from 'pinia'
import { ref } from 'vue'
import { MainTab } from '@/enums/main-tab'

export const useTabStore = defineStore('tab', () => {
  const current = ref<MainTab>(MainTab.Home)

  function setTab(tab: MainTab): void {
    current.value = tab
  }

  return {
    current,
    setTab
  }
})
