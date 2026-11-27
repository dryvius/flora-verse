import type { RankMetric } from '@/enums/rank-metric'
import type { FriendRankBoard } from '@/types/rank'

export interface RankRepository {
  getFriendRanking(metric: RankMetric): Promise<FriendRankBoard>
}
