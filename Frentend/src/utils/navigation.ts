import { LOGIN_REQUIRED_MESSAGE, hasAuthenticatedSession } from '@/utils/private-access'

function promptLoginRequired(): void {
  showErrorToast(LOGIN_REQUIRED_MESSAGE)
  switchToMe()
}

export function enterPrivatePage(): boolean {
  if (hasAuthenticatedSession()) {
    return true
  }
  promptLoginRequired()
  return false
}

export function openCapturePreview(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.navigateTo({ url: '/pages/capture/preview' })
}

export function openRecognizing(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.redirectTo({ url: '/pages/capture/recognizing' })
}

export function openCaptureResult(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.redirectTo({ url: '/pages/capture/result' })
}

export function openCandidates(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.navigateTo({ url: '/pages/capture/candidates' })
}

export function openCaptureSuccess(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.redirectTo({ url: '/pages/capture/success' })
}

export function openCapture(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.navigateTo({ url: '/pages/capture/index' })
}

export function switchToCapture(): void {
  openCapture()
}

export function switchToCollection(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.switchTab({ url: '/pages/collection/index' })
}

const HOME_URL = '/pages/home/index'

interface HomeSwitchOptions {
  fail: () => void
}

export function switchToHome(options?: HomeSwitchOptions): void {
  uni.switchTab({
    url: HOME_URL,
    fail: (): void => {
      options?.fail()
    }
  })
}

export function switchToRank(): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.switchTab({ url: '/pages/rank/index' })
}

const ME_URL = '/pages/me/index'
const ME_ROUTE = 'pages/me/index'

export function switchToMe(): void {
  uni.switchTab({ url: ME_URL })
}

export function returnToMe(): void {
  const pages = readPageStack()
  const previous = pages.length >= 2 ? pages[pages.length - 2] : undefined
  if (normalizeRoute(previous?.route) === ME_ROUTE) {
    try {
      uni.navigateBack({
        fail: (): void => {
          switchToMe()
        }
      })
    } catch {
      switchToMe()
    }
    return
  }
  switchToMe()
}

export function openExplorer(): void {
  switchToMe()
}

export function openSpeciesDetail(speciesId: string): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.navigateTo({ url: `/pages/collection/species-detail?id=${encodeURIComponent(speciesId)}` })
}

export function openInstanceDetail(instanceId: string): void {
  if (!enterPrivatePage()) {
    return
  }
  uni.navigateTo({ url: `/pages/collection/instance-detail?id=${encodeURIComponent(instanceId)}` })
}

export function openSettings(): void {
  uni.navigateTo({ url: '/pages/me/settings' })
}

const LOGIN_URL = '/pages/auth/login'
const REGISTER_URL = '/pages/auth/register'
const LOGIN_ROUTE = 'pages/auth/login'
const REGISTER_ROUTE = 'pages/auth/register'

interface RoutedPage {
  route?: string
}

let loginEntryLocked = false
let loginReturnLocked = false

function normalizeRoute(route: string | undefined): string {
  if (typeof route !== 'string') {
    return ''
  }
  const slashless = route.startsWith('/') ? route.slice(1) : route
  const queryIndex = slashless.indexOf('?')
  if (queryIndex < 0) {
    return slashless
  }
  return slashless.slice(0, queryIndex)
}

function readPageStack(): readonly RoutedPage[] {
  try {
    return getCurrentPages().map((page): RoutedPage => ({
      route: page.route
    }))
  } catch {
    return []
  }
}

function isLoginPageOpened(): boolean {
  return readPageStack().some((page): boolean => normalizeRoute(page.route) === LOGIN_ROUTE)
}

function findSourceDelta(pages: readonly RoutedPage[]): number | null {
  const currentIndex = pages.length - 1
  if (currentIndex < 1) {
    return null
  }
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const page = pages[index]
    if (!page) {
      continue
    }
    const route = normalizeRoute(page.route)
    if (route.length === 0 || route === LOGIN_ROUTE || route === REGISTER_ROUTE) {
      continue
    }
    return currentIndex - index
  }
  return null
}

function leaveLoginForHome(): void {
  try {
    switchToHome({
      fail: (): void => {
        loginReturnLocked = false
      }
    })
  } catch {
    loginReturnLocked = false
  }
}

export function prepareLoginReturn(): void {
  loginReturnLocked = false
}

export function releaseLoginEntry(): void {
  loginEntryLocked = false
}

export function openLogin(): void {
  if (loginEntryLocked || isLoginPageOpened()) {
    return
  }
  loginEntryLocked = true
  try {
    uni.navigateTo({
      url: LOGIN_URL,
      fail: (): void => {
        loginEntryLocked = false
      }
    })
  } catch {
    loginEntryLocked = false
  }
}

export function openRegister(): void {
  uni.navigateTo({ url: REGISTER_URL })
}

export function backToLogin(): void {
  const pages = readPageStack()
  const previous = pages.length >= 2 ? pages[pages.length - 2] : undefined
  const route = previous?.route ?? ''
  if (route === 'pages/auth/login' || route === LOGIN_URL) {
    uni.navigateBack()
    return
  }
  uni.redirectTo({ url: LOGIN_URL })
}

export function returnFromLogin(): void {
  if (loginReturnLocked) {
    return
  }
  loginReturnLocked = true
  const delta = findSourceDelta(readPageStack())
  if (delta === null) {
    leaveLoginForHome()
    return
  }
  try {
    uni.navigateBack({
      delta,
      fail: (): void => {
        leaveLoginForHome()
      }
    })
  } catch {
    leaveLoginForHome()
  }
}

export function showErrorToast(message: string): void {
  uni.showToast({
    title: message,
    icon: 'none'
  })
}

export function hideNativeTabBar(): void {
  // #ifdef H5
  uni.hideTabBar({
    fail: () => undefined
  })
  // #endif
}
