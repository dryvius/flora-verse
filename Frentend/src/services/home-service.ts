import { getRepositories } from '@/repositories/create-repository'
import type { HomeOverview } from '@/types/views'

export async function getHomeOverview(): Promise<HomeOverview> {
  return getRepositories().home.getOverview()
}
