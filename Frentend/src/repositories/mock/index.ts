import { HttpAuthRepository } from '@/repositories/http/http-auth-repository'
import { HybridUserRepository } from '@/repositories/hybrid-user-repository'
import { MockCaptureRepository } from '@/repositories/mock/mock-capture-repository'
import { MockCollectionRepository } from '@/repositories/mock/mock-collection-repository'
import { MockHomeRepository } from '@/repositories/mock/mock-home-repository'
import { MockImageRepository } from '@/repositories/mock/mock-image-repository'
import { MockRankRepository } from '@/repositories/mock/mock-rank-repository'
import { MockRecognitionRepository } from '@/repositories/mock/mock-recognition-repository'
import { MockSpeciesRepository } from '@/repositories/mock/mock-species-repository'
import { MockUserRepository } from '@/repositories/mock/mock-user-repository'
import type { Repositories } from '@/repositories/interfaces/repositories'

export function createMockRepositories(): Repositories {
  return {
    species: new MockSpeciesRepository(),
    image: new MockImageRepository(),
    recognition: new MockRecognitionRepository(),
    capture: new MockCaptureRepository(),
    collection: new MockCollectionRepository(),
    user: new HybridUserRepository(new MockUserRepository()),
    auth: new HttpAuthRepository(),
    home: new MockHomeRepository(),
    rank: new MockRankRepository()
  }
}
