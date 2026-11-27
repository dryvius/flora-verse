import type { HomeOverview } from '@/types/views'

export interface HomeRepository {
  getOverview(): Promise<HomeOverview>
}
