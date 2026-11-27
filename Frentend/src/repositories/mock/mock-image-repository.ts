import { MOCK_UPLOAD_DELAY_MS } from '@/constants/app'
import { ImageVariant } from '@/enums/image-variant'
import { delay } from '@/repositories/mock/delay'
import { resolveMockImageUrl } from '@/repositories/mock/image-url'
import { getMockDb, mutateMockDb } from '@/repositories/mock/store'
import type { ImageRepository } from '@/repositories/interfaces/image-repository'
import type { ImageAsset } from '@/types/api'
import { createId } from '@/utils/id'

function persistLocalFile(tempPath: string): Promise<string> {
  return new Promise((resolve) => {
    uni.saveFile({
      tempFilePath: tempPath,
      success: (res) => {
        resolve(res.savedFilePath)
      },
      fail: () => {
        resolve(tempPath)
      }
    })
  })
}

export class MockImageRepository implements ImageRepository {
  async upload(localFilePath: string): Promise<ImageAsset> {
    await delay(MOCK_UPLOAD_DELAY_MS)
    const savedPath = await persistLocalFile(localFilePath)
    const imageKey = createId('img')
    mutateMockDb((db) => {
      db.images.push({
        imageKey,
        localPath: savedPath
      })
    })
    return {
      imageKey,
      originalUrl: savedPath,
      displayUrl: savedPath,
      thumbnailUrl: savedPath
    }
  }

  resolveUrl(imageKey: string, _variant: ImageVariant): string {
    return resolveMockImageUrl(getMockDb(), imageKey)
  }
}
