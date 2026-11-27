import { ImageVariant } from '@/enums/image-variant'
import { getRepositories } from '@/repositories/create-repository'
import type { ImageAsset } from '@/types/api'
import { assertImageFile, getFileSize } from '@/utils/image-validate'

export async function validateAndUploadImage(localFilePath: string): Promise<ImageAsset> {
  const size = await getFileSize(localFilePath)
  assertImageFile(localFilePath, size)
  return getRepositories().image.upload(localFilePath)
}

export function resolveImageUrl(imageKey: string, variant: ImageVariant = ImageVariant.Display): string {
  return getRepositories().image.resolveUrl(imageKey, variant)
}
