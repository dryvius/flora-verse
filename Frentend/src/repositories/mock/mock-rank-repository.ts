import { DEMO_USER_ID } from '@/constants/app'
import { RankMetric } from '@/enums/rank-metric'
import { sumSpeciesCombatPower } from '@/repositories/mock/combat'
import { getMockDb } from '@/repositories/mock/store'
import type { RankRepository } from '@/repositories/interfaces/rank-repository'
import type { FriendRankBoard, FriendRankEntry } from '@/types/rank'

interface RankCandidate {
  userId: string
  displayName: string
  speciesIds: string[]
  isSelf: boolean
}

export class MockRankRepository implements RankRepository {
  async getFriendRanking(metric: RankMetric): Promise<FriendRankBoard> {
    const db = getMockDb()
    const selfSpeciesIds = [
      ...new Set(
        db.discoveries
          .filter((item) => item.userId === DEMO_USER_ID)
          .map((item) => item.speciesId),
      ),
    ]

    const candidates: RankCandidate[] = [
      {
        userId: db.user.id,
        displayName: db.user.displayName,
        speciesIds: selfSpeciesIds,
        isSelf: true,
      },
      ...db.friends.map((friend) => ({
        userId: friend.id,
        displayName: friend.displayName,
        speciesIds: [...new Set(friend.discoveredSpeciesIds)],
        isSelf: false,
      })),
    ]

    const scored = candidates.map((candidate) => {
      const speciesCount = candidate.speciesIds.length
      const combatPower = sumSpeciesCombatPower(db.species, candidate.speciesIds)
      const score = metric === RankMetric.SpeciesCount ? speciesCount : combatPower
      return {
        userId: candidate.userId,
        displayName: candidate.displayName,
        avatarText: candidate.displayName.slice(0, 1),
        speciesCount,
        combatPower,
        score,
        isSelf: candidate.isSelf,
      }
    })

    scored.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }
      if (right.combatPower !== left.combatPower) {
        return right.combatPower - left.combatPower
      }
      return left.displayName.localeCompare(right.displayName, 'zh-CN')
    })

    const entries: FriendRankEntry[] = scored.map((item, index) => ({
      ...item,
      rank: index + 1,
    }))

    const selfEntry = entries.find((item) => item.isSelf)

    return {
      metric,
      entries,
      selfRank: selfEntry?.rank ?? null,
    }
  }
}
