export interface BusinessErrorDetails {
  statusCode?: number | null
  requestId?: string | null
}

export class BusinessError extends Error {
  readonly code: string
  readonly userMessage: string
  readonly statusCode: number | null
  readonly requestId: string | null

  constructor(code: string, userMessage: string, details?: BusinessErrorDetails) {
    super(userMessage)
    this.name = 'BusinessError'
    this.code = code
    this.userMessage = userMessage
    this.statusCode = details?.statusCode ?? null
    this.requestId = details?.requestId ?? null
  }
}

export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof BusinessError) {
    return error.userMessage
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
