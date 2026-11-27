import { getRepositories } from '@/repositories/create-repository'
import type { RankMetric } from '@/enums/rank-metric'
import type { FriendRankBoard } from '@/types/rank'

export async function getFriendRanking(metric: RankMetric): Promise<FriendRankBoard> {
  return getRepositories().rank.getFriendRanking(metric)
}
