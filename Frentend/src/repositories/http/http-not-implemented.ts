import { ERROR_CODES } from '@/constants/error-codes'
import { BusinessError } from '@/utils/business-error'

export function notImplemented(): never {
  throw new BusinessError(ERROR_CODES.HTTP_NOT_IMPLEMENTED, 'HTTP 数据源尚未接入，请使用 Mock 模式')
}
