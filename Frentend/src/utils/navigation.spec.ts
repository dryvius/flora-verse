import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoginExit } from '@/composables/useLoginExit'
import { AuthStatus } from '@/enums/auth-status'
import { useUserStore } from '@/stores/user-store'
import { getCapturedRequests, resetUniMock } from '@/test/uni-mock'
import { LOGIN_REQUIRED_MESSAGE } from '@/utils/private-access'
import {
  backToLogin,
  enterPrivatePage,
  openCapture,
  openInstanceDetail,
  openLogin,
  openSpeciesDetail,
  prepareLoginReturn,
  releaseLoginEntry,
  returnFromLogin,
  returnToMe,
  switchToCollection,
  switchToRank
} from '@/utils/navigation'

const loginPageHooks = vi.hoisted((): { unload: Array<() => void> } => ({
  unload: []
}))

vi.mock('@dcloudio/uni-app', () => ({
  onUnload: (hook: () => void): void => {
    loginPageHooks.unload.push(hook)
  }
}))

interface StackPage {
  route: string
}

interface NavCall {
  method: 'navigateTo' | 'navigateBack' | 'redirectTo' | 'switchTab'
  url: string
  delta: number
}

interface RouteOptions {
  url?: string
  delta?: number
  title?: string
  success?: () => void
  fail?: () => void
}

type NavResult = 'success' | 'fail'

const calls: NavCall[] = []
const toasts: string[] = []
let pages: StackPage[] = []
let navigateToResult: NavResult | 'hold' = 'success'
let navigateBackResult: NavResult = 'success'
let switchTabResult: NavResult = 'success'
let stackBroken = false
let releaseNavigateTo: (() => void) | null = null
let stopLoginExit: (() => void) | null = null

function routeFromUrl(url: string): string {
  const path = url.split('?')[0] ?? ''
  if (path.startsWith('/')) {
    return path.slice(1)
  }
  return path
}

function pageRoutes(): string[] {
  return pages.map((page): string => page.route)
}

function callsOf(method: NavCall['method']): NavCall[] {
  return calls.filter((call): boolean => call.method === method)
}

function homeSwitches(): NavCall[] {
  return calls.filter((call): boolean => call.method === 'switchTab' && call.url === '/pages/home/index')
}

function installNavigationMock(): void {
  const uniApi = (globalThis as unknown as { uni: Record<string, (options?: RouteOptions) => void> }).uni
  ;(globalThis as unknown as { getCurrentPages: () => StackPage[] }).getCurrentPages = (): StackPage[] => {
    if (stackBroken) {
      throw new Error('page stack unavailable')
    }
    return pages.map((page): StackPage => ({ route: page.route }))
  }
  uniApi.navigateTo = (options?: RouteOptions): void => {
    const url = options?.url ?? ''
    calls.push({ method: 'navigateTo', url, delta: 0 })
    if (navigateToResult === 'fail') {
      options?.fail?.()
      return
    }
    const open = (): void => {
      pages.push({ route: routeFromUrl(url) })
      options?.success?.()
    }
    if (navigateToResult === 'hold') {
      releaseNavigateTo = open
      return
    }
    open()
  }
  uniApi.redirectTo = (options?: RouteOptions): void => {
    const url = options?.url ?? ''
    calls.push({ method: 'redirectTo', url, delta: 0 })
    if (pages.length > 0) {
      pages.pop()
    }
    pages.push({ route: routeFromUrl(url) })
    options?.success?.()
  }
  uniApi.navigateBack = (options?: RouteOptions): void => {
    const delta = options?.delta ?? 1
    calls.push({ method: 'navigateBack', url: '', delta })
    if (navigateBackResult === 'fail' || pages.length <= 1) {
      options?.fail?.()
      return
    }
    const count = Math.min(delta, pages.length - 1)
    pages.splice(pages.length - count, count)
    options?.success?.()
  }
  uniApi.showToast = (options?: RouteOptions): void => {
    toasts.push(options?.title ?? '')
  }
  uniApi.switchTab = (options?: RouteOptions): void => {
    const url = options?.url ?? ''
    calls.push({ method: 'switchTab', url, delta: 0 })
    if (switchTabResult === 'fail') {
      options?.fail?.()
      return
    }
    pages = [{ route: routeFromUrl(url) }]
    options?.success?.()
  }
}

function setStack(routes: string[]): void {
  pages = routes.map((route): StackPage => ({ route }))
}

function settleHeldNavigateTo(): void {
  const release = releaseNavigateTo
  releaseNavigateTo = null
  release?.()
}

function mountLoginExit(): void {
  stopLoginExit?.()
  const scope = effectScope()
  scope.run((): void => {
    useLoginExit()
  })
  stopLoginExit = (): void => {
    scope.stop()
    stopLoginExit = null
  }
}

function leaveCurrentLoginPage(): void {
  const current = pages[pages.length - 1]
  if (current?.route === 'pages/auth/login' || current?.route === '/pages/auth/login') {
    pages.pop()
  }
  loginPageHooks.unload.forEach((hook): void => {
    hook()
  })
}

describe('登录导航与回跳', () => {
  beforeEach((): void => {
    resetUniMock()
    calls.length = 0
    toasts.length = 0
    pages = []
    navigateToResult = 'success'
    navigateBackResult = 'success'
    switchTabResult = 'success'
    stackBroken = false
    releaseNavigateTo = null
    loginPageHooks.unload.length = 0
    installNavigationMock()
    prepareLoginReturn()
    releaseLoginEntry()
    setActivePinia(createPinia())
  })

  afterEach((): void => {
    stopLoginExit?.()
    stopLoginExit = null
    vi.restoreAllMocks()
  })

  describe('登录回跳', () => {
    it('有效来源页面时，登录成功返回来源页面', (): void => {
      setStack(['/pages/collection/index', 'pages/auth/login'])
      returnFromLogin()
      expect(callsOf('navigateBack').map((call): number => call.delta)).toEqual([1])
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['/pages/collection/index'])
    })

    it('没有有效来源页面时回到营地', (): void => {
      setStack(['pages/auth/login'])
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/home/index'])

      prepareLoginReturn()
      calls.length = 0
      setStack([])
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/home/index'])
    })

    it('页面栈异常时能够安全兜底', (): void => {
      setStack(['pages/auth/login?from=direct', '/pages/auth/login'])
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/home/index'])

      prepareLoginReturn()
      calls.length = 0
      setStack(['pages/me/index', 'pages/auth/login'])
      navigateBackResult = 'fail'
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(1)
      expect(homeSwitches()).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/home/index'])

      prepareLoginReturn()
      calls.length = 0
      stackBroken = true
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/home/index'])
    })

    it('前一个页面是登录页时跳过登录页回到业务来源', (): void => {
      setStack(['pages/me/index', '/pages/auth/login', 'pages/auth/login'])
      returnFromLogin()
      expect(callsOf('navigateBack').map((call): number => call.delta)).toEqual([2])
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index'])
    })

    it('switchTab 失败后允许再次回跳', (): void => {
      setStack(['pages/auth/login'])
      switchTabResult = 'fail'
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/auth/login'])

      switchTabResult = 'success'
      calls.length = 0
      returnFromLogin()
      expect(homeSwitches()).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/home/index'])
    })

    it('页面栈不可读时返回登录改为重开登录页', (): void => {
      setStack(['pages/me/index', 'pages/auth/register'])
      stackBroken = true
      backToLogin()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(callsOf('redirectTo').map((call): string => call.url)).toEqual(['/pages/auth/login'])
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
    })

    it('登录成功后不会重复执行回跳', (): void => {
      setStack(['pages/collection/index', 'pages/auth/login'])
      returnFromLogin()
      releaseLoginEntry()
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(1)
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/collection/index'])
    })

    it('从注册页返回登录页后，仍能回到最初来源页面', (): void => {
      setStack(['pages/me/index', 'pages/auth/login', 'pages/auth/register'])
      backToLogin()
      expect(callsOf('redirectTo')).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
      returnFromLogin()
      expect(callsOf('navigateBack').map((call): number => call.delta)).toEqual([1, 1])
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index'])
    })

    it('注册页还留在登录页下方时，登录成功仍回到最初来源', (): void => {
      setStack(['pages/collection/index', 'pages/auth/register', 'pages/auth/login'])
      returnFromLogin()
      expect(callsOf('navigateBack').map((call): number => call.delta)).toEqual([2])
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/collection/index'])
    })
  })

  describe('登录入口防重', () => {
    it('连续调用 openLogin 只打开一次登录页面', (): void => {
      navigateToResult = 'hold'
      setStack(['pages/me/index'])
      openLogin()
      openLogin()
      expect(callsOf('navigateTo').map((call): string => call.url)).toEqual(['/pages/auth/login'])
      settleHeldNavigateTo()
      openLogin()
      expect(callsOf('navigateTo')).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])

      setStack(['pages/collection/index', '/pages/auth/login'])
      openLogin()
      expect(callsOf('navigateTo')).toHaveLength(1)
    })

    it('导航失败后允许再次打开登录页面', (): void => {
      navigateToResult = 'fail'
      setStack(['pages/me/index'])
      openLogin()
      expect(callsOf('navigateTo')).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/me/index'])

      navigateToResult = 'success'
      openLogin()
      expect(callsOf('navigateTo')).toHaveLength(2)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
    })

    it('正常离开登录页后允许再次打开登录页面', (): void => {
      setStack(['pages/me/index'])
      openLogin()
      mountLoginExit()
      openLogin()
      expect(callsOf('navigateTo')).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
      leaveCurrentLoginPage()
      openLogin()
      expect(callsOf('navigateTo')).toHaveLength(2)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
    })
  })

  describe('已认证用户自动离开', () => {
    it('登录页进入时已经 Authenticated，应自动离开', (): void => {
      const store = useUserStore()
      const bootstrap = vi.spyOn(store, 'bootstrap')
      store.authStatus = AuthStatus.Authenticated
      setStack(['pages/me/index', 'pages/auth/login'])
      mountLoginExit()
      expect(callsOf('navigateBack')).toHaveLength(1)
      expect(pageRoutes()).toEqual(['pages/me/index'])
      expect(bootstrap).not.toHaveBeenCalled()
      expect(getCapturedRequests()).toHaveLength(0)
    })

    it('登录期间身份确认成功后，应自动离开', async (): Promise<void> => {
      const store = useUserStore()
      const bootstrap = vi.spyOn(store, 'bootstrap')
      setStack(['pages/collection/index', 'pages/auth/login'])
      mountLoginExit()
      expect(callsOf('navigateBack')).toHaveLength(0)
      store.authStatus = AuthStatus.Bootstrapping
      await nextTick()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(0)
      store.authStatus = AuthStatus.Authenticated
      await nextTick()
      expect(pageRoutes()).toEqual(['pages/collection/index'])
      expect(bootstrap).not.toHaveBeenCalled()
      expect(getCapturedRequests()).toHaveLength(0)
    })

    it('Guest 不会自动离开', async (): Promise<void> => {
      const store = useUserStore()
      const bootstrap = vi.spyOn(store, 'bootstrap')
      setStack(['pages/me/index', 'pages/auth/login'])
      mountLoginExit()
      await nextTick()
      store.authStatus = AuthStatus.Guest
      await nextTick()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
      expect(bootstrap).not.toHaveBeenCalled()
      expect(getCapturedRequests()).toHaveLength(0)
    })

    it('Unavailable 不会自动离开', async (): Promise<void> => {
      const store = useUserStore()
      const bootstrap = vi.spyOn(store, 'bootstrap')
      store.authStatus = AuthStatus.Unavailable
      setStack(['pages/me/index', 'pages/auth/login'])
      mountLoginExit()
      await nextTick()
      store.authStatus = AuthStatus.Guest
      await nextTick()
      store.authStatus = AuthStatus.Unavailable
      await nextTick()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
      expect(bootstrap).not.toHaveBeenCalled()
      expect(getCapturedRequests()).toHaveLength(0)
    })

    it('Bootstrapping 不会被误判为已认证', async (): Promise<void> => {
      const store = useUserStore()
      store.authStatus = AuthStatus.Bootstrapping
      setStack(['pages/me/index', 'pages/auth/login'])
      mountLoginExit()
      await nextTick()
      store.authStatus = AuthStatus.Guest
      await nextTick()
      store.authStatus = AuthStatus.Bootstrapping
      await nextTick()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index', 'pages/auth/login'])
    })

    it('自动离开与登录成功后的主动回跳不会重复执行', async (): Promise<void> => {
      const store = useUserStore()
      setStack(['pages/me/index', 'pages/auth/login'])
      mountLoginExit()
      store.authStatus = AuthStatus.Authenticated
      await nextTick()
      returnFromLogin()
      expect(callsOf('navigateBack')).toHaveLength(1)
      expect(homeSwitches()).toHaveLength(0)
      expect(pageRoutes()).toEqual(['pages/me/index'])
    })
  })

  describe('未登录访问私有内容', () => {
    it('提示请先登录并回到我的，不打开收录、图鉴、排行或档案', (): void => {
      const store = useUserStore()
      store.authStatus = AuthStatus.Guest
      setStack(['pages/home/index'])

      expect(enterPrivatePage()).toBe(false)
      openCapture()
      switchToCollection()
      switchToRank()
      openSpeciesDetail('species-1')
      openInstanceDetail('instance-1')

      expect(toasts).toEqual([
        LOGIN_REQUIRED_MESSAGE,
        LOGIN_REQUIRED_MESSAGE,
        LOGIN_REQUIRED_MESSAGE,
        LOGIN_REQUIRED_MESSAGE,
        LOGIN_REQUIRED_MESSAGE,
        LOGIN_REQUIRED_MESSAGE
      ])
      expect(LOGIN_REQUIRED_MESSAGE).toBe('请先登录')
      expect(callsOf('navigateTo')).toHaveLength(0)
      expect(callsOf('switchTab').map((call): string => call.url)).toEqual([
        '/pages/me/index',
        '/pages/me/index',
        '/pages/me/index',
        '/pages/me/index',
        '/pages/me/index',
        '/pages/me/index'
      ])
      expect(pageRoutes()).toEqual(['pages/me/index'])
    })

    it('已登录时可以进入收录、图鉴、排行和档案', (): void => {
      const store = useUserStore()
      store.authStatus = AuthStatus.Authenticated
      setStack(['pages/home/index'])

      expect(enterPrivatePage()).toBe(true)
      openCapture()
      switchToCollection()
      switchToRank()
      openSpeciesDetail('species 1')
      openInstanceDetail('instance/1')

      expect(toasts).toHaveLength(0)
      expect(callsOf('navigateTo').map((call): string => call.url)).toEqual([
        '/pages/capture/index',
        '/pages/collection/species-detail?id=species%201',
        '/pages/collection/instance-detail?id=instance%2F1'
      ])
      expect(callsOf('switchTab').map((call): string => call.url)).toEqual([
        '/pages/collection/index',
        '/pages/rank/index'
      ])
    })
  })

  describe('退出后返回我的', () => {
    it('从我的进入设置后返回上一页', (): void => {
      setStack(['/pages/me/index', 'pages/me/settings'])
      returnToMe()
      expect(callsOf('navigateBack')).toHaveLength(1)
      expect(callsOf('switchTab')).toHaveLength(0)
      expect(pageRoutes()).toEqual(['/pages/me/index'])
    })

    it('设置页没有我的来源时切换到我的', (): void => {
      setStack(['pages/me/settings'])
      returnToMe()
      expect(callsOf('navigateBack')).toHaveLength(0)
      expect(callsOf('switchTab').map((call): string => call.url)).toEqual(['/pages/me/index'])
      expect(pageRoutes()).toEqual(['pages/me/index'])
    })

    it('返回我的失败时切换到我的', (): void => {
      setStack(['pages/me/index', 'pages/me/settings'])
      navigateBackResult = 'fail'
      returnToMe()
      expect(callsOf('navigateBack')).toHaveLength(1)
      expect(callsOf('switchTab').map((call): string => call.url)).toEqual(['/pages/me/index'])
      expect(pageRoutes()).toEqual(['pages/me/index'])
    })
  })
})
