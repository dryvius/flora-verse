import { beforeEach, describe, expect, it } from 'vitest'
import { getRepositories } from '@/repositories/create-repository'
import { HttpAuthRepository } from '@/repositories/http/http-auth-repository'
import { HybridUserRepository } from '@/repositories/hybrid-user-repository'
import { MockCaptureRepository } from '@/repositories/mock/mock-capture-repository'
import { MockCollectionRepository } from '@/repositories/mock/mock-collection-repository'
import { MockHomeRepository } from '@/repositories/mock/mock-home-repository'
import { MockRankRepository } from '@/repositories/mock/mock-rank-repository'
import { MockSpeciesRepository } from '@/repositories/mock/mock-species-repository'
import { RankMetric } from '@/enums/rank-metric'
import { getCapturedRequests, resetUniMock } from '@/test/uni-mock'
import { setAccessToken } from '@/utils/token-storage'

describe('Mock 数据源保持植物业务', () => {
  beforeEach((): void => {
    resetUniMock()
  })

  it('有 Token 时营地、图鉴、排行和统计仍然不请求 Backend', async (): Promise<void> => {
    setAccessToken('should-not-switch-plants')
    const repositories = getRepositories()

    expect(import.meta.env.VITE_DATA_SOURCE).toBe('mock')
    expect(repositories.home).toBeInstanceOf(MockHomeRepository)
    expect(repositories.collection).toBeInstanceOf(MockCollectionRepository)
    expect(repositories.capture).toBeInstanceOf(MockCaptureRepository)
    expect(repositories.rank).toBeInstanceOf(MockRankRepository)
    expect(repositories.species).toBeInstanceOf(MockSpeciesRepository)
    expect(repositories.user).toBeInstanceOf(HybridUserRepository)
    expect(repositories.auth).toBeInstanceOf(HttpAuthRepository)

    await repositories.home.getOverview()
    await repositories.collection.listDiscoveredSpecies({ page: 1, pageSize: 20 })
    await repositories.rank.getFriendRanking(RankMetric.SpeciesCount)
    await repositories.user.getStats()

    expect(getCapturedRequests()).toHaveLength(0)
  })
})
