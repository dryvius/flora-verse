import type { ImageVariant } from '@/enums/image-variant'
import type { ImageAsset } from '@/types/api'

export interface ImageRepository {
  upload(localFilePath: string): Promise<ImageAsset>
  resolveUrl(imageKey: string, variant: ImageVariant): string
}
