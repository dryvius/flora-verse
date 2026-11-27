import type { AuthRepository } from '@/repositories/interfaces/auth-repository'
import type { CaptureRepository } from '@/repositories/interfaces/capture-repository'
import type { CollectionRepository } from '@/repositories/interfaces/collection-repository'
import type { HomeRepository } from '@/repositories/interfaces/home-repository'
import type { ImageRepository } from '@/repositories/interfaces/image-repository'
import type { RankRepository } from '@/repositories/interfaces/rank-repository'
import type { RecognitionRepository } from '@/repositories/interfaces/recognition-repository'
import type { SpeciesRepository } from '@/repositories/interfaces/species-repository'
import type { UserRepository } from '@/repositories/interfaces/user-repository'

export interface Repositories {
  species: SpeciesRepository
  image: ImageRepository
  recognition: RecognitionRepository
  capture: CaptureRepository
  collection: CollectionRepository
  user: UserRepository
  auth: AuthRepository
  home: HomeRepository
  rank: RankRepository
}
