import type { RankMetric } from '@/enums/rank-metric'

export interface FriendRankEntry {
  userId: string
  displayName: string
  avatarText: string
  rank: number
  speciesCount: number
  combatPower: number
  score: number
  isSelf: boolean
}

export interface FriendRankBoard {
  metric: RankMetric
  entries: FriendRankEntry[]
  selfRank: number | null
}
