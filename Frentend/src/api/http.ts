import { API_SUCCESS_CODE } from '@/constants/api-contract'
import { ERROR_CODES } from '@/constants/error-codes'
import type { ApiResponse } from '@/types/api'
import { BusinessError } from '@/utils/business-error'
import { getAccessToken } from '@/utils/token-storage'

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  auth?: boolean
}

interface UniRequestResult {
  statusCode?: number
  data?: unknown
}

function getBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || ''
  return configured.replace(/\/$/, '')
}

function isHttpSuccess(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300
}

function readPayload<T>(data: unknown): ApiResponse<T> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }
  const record = data as Record<string, unknown>
  if (typeof record.code !== 'string') {
    return null
  }
  return {
    code: record.code,
    message: typeof record.message === 'string' ? record.message : '',
    data: record.data as T,
    requestId: typeof record.requestId === 'string' ? record.requestId : undefined
  }
}

function buildHeader(auth: boolean | undefined): Record<string, string> {
  if (auth === false) {
    return {}
  }
  const token = getAccessToken()
  if (!token) {
    return {}
  }
  return {
    Authorization: `Bearer ${token}`
  }
}

function rejectResponse<T>(
  statusCode: number,
  payload: ApiResponse<T> | null,
  reject: (reason: BusinessError) => void
): void {
  const code = payload && payload.code !== API_SUCCESS_CODE ? payload.code : ERROR_CODES.UNEXPECTED_RESPONSE
  const message = payload?.message || `请求失败（HTTP ${statusCode}）`
  reject(
    new BusinessError(code, message, {
      statusCode,
      requestId: payload?.requestId ?? null
    })
  )
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new BusinessError(ERROR_CODES.API_BASE_URL_MISSING, '未配置 VITE_API_BASE_URL，无法连接 Backend')
  }

  const header = buildHeader(options.auth)
  const url = `${baseUrl}${options.url}`

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method ?? 'GET',
      data: options.data,
      header,
      success: (res: UniRequestResult): void => {
        const statusCode = typeof res.statusCode === 'number' ? res.statusCode : 0
        const payload = readPayload<T>(res.data)
        if (isHttpSuccess(statusCode) && payload?.code === API_SUCCESS_CODE) {
          resolve(payload.data)
          return
        }
        rejectResponse(statusCode, payload, reject)
      },
      fail: (): void => {
        reject(
          new BusinessError(ERROR_CODES.NETWORK_ERROR, '网络异常，请稍后重试', {
            statusCode: null,
            requestId: null
          })
        )
      }
    })
  })
}
