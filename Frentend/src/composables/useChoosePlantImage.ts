import { ERROR_CODES } from '@/constants/error-codes'
import { BusinessError } from '@/utils/business-error'

export function choosePlantImage(source: 'camera' | 'album'): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sourceType: [source],
      sizeType: ['compressed'],
      success: (res) => {
        const path = res.tempFilePaths[0]
        if (!path) {
          reject(new BusinessError(ERROR_CODES.IMAGE_EMPTY, '未获取到图片，请重新选择'))
          return
        }
        resolve(path)
      },
      fail: (err) => {
        const message = err.errMsg ?? ''
        if (message.includes('cancel') || message.includes('Cancel')) {
          reject(new BusinessError(ERROR_CODES.USER_CANCELLED, '已取消'))
          return
        }
        if (message.includes('auth') || message.includes('deny') || message.includes('authorize')) {
          const hint =
            source === 'camera'
              ? '需要摄像头权限才能拍摄植物，请在设置中开启，或改用相册选图'
              : '需要相册权限才能选择植物照片，请在设置中开启'
          reject(new BusinessError(ERROR_CODES.PERMISSION_DENIED, hint))
          return
        }
        reject(new BusinessError(ERROR_CODES.CHOOSE_IMAGE_FAILED, '选择图片失败，请重试'))
      }
    })
  })
}
