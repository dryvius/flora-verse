import { ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_SIZE_BYTES } from '@/constants/image'
import { ERROR_CODES } from '@/constants/error-codes'
import { BusinessError } from '@/utils/business-error'

function getExtension(filePath: string): string {
  const normalized = filePath.split('?')[0] ?? filePath
  const parts = normalized.split('.')
  const ext = parts[parts.length - 1]
  return (ext ?? '').toLowerCase()
}

export function assertImageFile(filePath: string, sizeBytes: number | null): void {
  if (!filePath) {
    throw new BusinessError(ERROR_CODES.IMAGE_EMPTY, '未获取到图片，请重新选择')
  }

  const extension = getExtension(filePath)
  const hasKnownExtension = ALLOWED_IMAGE_EXTENSIONS.some((item) => item === extension)
  const isTempPath = filePath.startsWith('wxfile://') || filePath.startsWith('http://tmp') || filePath.startsWith('blob:')

  if (extension && !hasKnownExtension && !isTempPath) {
    throw new BusinessError(ERROR_CODES.IMAGE_INVALID, '暂不支持该图片格式，请使用 JPG 或 PNG')
  }

  if (sizeBytes !== null && sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new BusinessError(ERROR_CODES.IMAGE_TOO_LARGE, '图片过大，请压缩后重新选择')
  }
}

export function getFileSize(filePath: string): Promise<number | null> {
  return new Promise((resolve) => {
    uni.getFileInfo({
      filePath,
      success: (res) => {
        resolve(res.size)
      },
      fail: () => {
        resolve(null)
      }
    })
  })
}
