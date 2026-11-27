import { onShow } from '@dcloudio/uni-app'
import { MainTab } from '@/enums/main-tab'
import { useTabStore } from '@/stores/tab-store'
import { hideNativeTabBar } from '@/utils/navigation'
import { hasAuthenticatedSession, persistPrivateTabVisibility } from '@/utils/private-access'

interface WeixinTabBarState {
  selected: string
  showPrivateTabs: boolean
}

interface WeixinTabBar {
  setData: (data: WeixinTabBarState) => void
}

interface WeixinTabPage {
  getTabBar?: () => WeixinTabBar
}

const NATIVE_PRIVATE_TAB_INDEXES = [1, 2] as const
const TAB_BAR_RETRY_DELAY_MS = 50

function applyWeixinTabBar(tab: MainTab): void {
  try {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1] as WeixinTabPage | undefined
    const bar = page?.getTabBar?.()
    if (!bar) {
      return
    }
    bar.setData({
      selected: tab,
      showPrivateTabs: hasAuthenticatedSession()
    })
  } catch {
    return
  }
}

function hideNativePrivateTabs(): void {
  const visible = hasAuthenticatedSession()
  for (const index of NATIVE_PRIVATE_TAB_INDEXES) {
    try {
      uni.setTabBarItem({
        index,
        visible,
        fail: (): void => undefined
      })
    } catch {
      return
    }
  }
}

export function syncTabBarPresentation(tab: MainTab): void {
  persistPrivateTabVisibility()
  hideNativeTabBar()
  hideNativePrivateTabs()
  applyWeixinTabBar(tab)
}

function scheduleTabBarPresentation(tab: MainTab): void {
  syncTabBarPresentation(tab)
  setTimeout((): void => {
    syncTabBarPresentation(tab)
  }, TAB_BAR_RETRY_DELAY_MS)
}

export function useMainTabPage(tab: MainTab): void {
  onShow((): void => {
    useTabStore().setTab(tab)
    scheduleTabBarPresentation(tab)
  })
}
