import type { MockDatabase } from '@/repositories/mock/types'

const DEFAULT_PLANT_IMAGE_URL = '/static/plants/EpipremnumAureum.jpg'

export function resolveMockImageUrl(db: MockDatabase, imageKey: string): string {
  const uploaded = db.images.find((item) => item.imageKey === imageKey)
  if (uploaded) {
    return uploaded.localPath
  }
  return DEFAULT_PLANT_IMAGE_URL
}
