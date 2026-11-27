import { SESSION_INVALID_ERROR_CODES } from '@/constants/api-contract'
import { BusinessError } from '@/utils/business-error'

const SESSION_INVALID_CODES: ReadonlySet<string> = new Set(SESSION_INVALID_ERROR_CODES)

export function isSessionInvalidError(error: unknown): boolean {
  return error instanceof BusinessError && SESSION_INVALID_CODES.has(error.code)
}
