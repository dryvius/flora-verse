export interface CapturedRequest {
  url: string
  method: string
  data: unknown
  header: Record<string, string>
}

interface UniRequestOptions {
  url: string
  method?: string
  data?: unknown
  header?: Record<string, string>
  success?: (result: { statusCode?: number; data?: unknown }) => void
  fail?: (error: { errMsg: string }) => void
}

type RequestHandler = (options: UniRequestOptions) => void

const memory = new Map<string, unknown>()
const captured: CapturedRequest[] = []

let handler: RequestHandler = (options): void => {
  options.fail?.({ errMsg: 'request:fail' })
}

function installUniMock(): void {
  const api = {
    getStorageSync(key: string): unknown {
      if (!memory.has(key)) {
        return ''
      }
      return memory.get(key)
    },
    setStorageSync(key: string, value: unknown): void {
      memory.set(key, value)
    },
    removeStorageSync(key: string): void {
      memory.delete(key)
    },
    request(options: UniRequestOptions): void {
      captured.push({
        url: options.url,
        method: options.method ?? 'GET',
        data: options.data,
        header: { ...(options.header ?? {}) }
      })
      queueMicrotask((): void => {
        handler(options)
      })
    }
  }
  ;(globalThis as unknown as { uni: typeof api }).uni = api
}

export function resetUniMock(): void {
  memory.clear()
  captured.length = 0
  handler = (options): void => {
    options.fail?.({ errMsg: 'request:fail' })
  }
  installUniMock()
}

export function setRequestHandler(next: RequestHandler): void {
  handler = next
}

export function getCapturedRequests(): readonly CapturedRequest[] {
  return captured
}

installUniMock()
