import { API_ENDPOINTS, fillPath } from '@/api/endpoints'
import { request } from '@/api/http'
import { HttpAuthRepository } from '@/repositories/http/http-auth-repository'
import { notImplemented } from '@/repositories/http/http-not-implemented'
import { HybridUserRepository } from '@/repositories/hybrid-user-repository'
import { MockUserRepository } from '@/repositories/mock/mock-user-repository'
import type { Repositories } from '@/repositories/interfaces/repositories'
import type { CaptureRepository } from '@/repositories/interfaces/capture-repository'
import type { CollectionRepository } from '@/repositories/interfaces/collection-repository'
import type { HomeRepository } from '@/repositories/interfaces/home-repository'
import type { ImageRepository } from '@/repositories/interfaces/image-repository'
import type { RankRepository } from '@/repositories/interfaces/rank-repository'
import type { RecognitionRepository } from '@/repositories/interfaces/recognition-repository'
import type { SpeciesRepository } from '@/repositories/interfaces/species-repository'
import type { ImageVariant } from '@/enums/image-variant'
import type { RankMetric } from '@/enums/rank-metric'
import type { ImageAsset, InstanceListQuery, PageQuery, PageResult, SpeciesSearchQuery } from '@/types/api'
import type { CaptureResult, CreateCapturePayload } from '@/types/plant-capture'
import type { PlantSpecies } from '@/types/plant-species'
import type { FriendRankBoard } from '@/types/rank'
import type { CreateRecognitionTaskPayload, RecognitionTask } from '@/types/recognition'
import type { DiscoveredSpeciesView, HomeOverview, InstanceCard, InstanceDetailView, SpeciesDetailView } from '@/types/views'

class HttpSpeciesRepository implements SpeciesRepository {
  async getById(id: string): Promise<PlantSpecies> {
    return request<PlantSpecies>({ url: fillPath(API_ENDPOINTS.speciesDetail, id) })
  }

  async search(_query: SpeciesSearchQuery): Promise<PageResult<PlantSpecies>> {
    return notImplemented()
  }
}

class HttpImageRepository implements ImageRepository {
  async upload(_localFilePath: string): Promise<ImageAsset> {
    return notImplemented()
  }

  resolveUrl(_imageKey: string, _variant: ImageVariant): string {
    return notImplemented()
  }
}

class HttpRecognitionRepository implements RecognitionRepository {
  async createTask(_payload: CreateRecognitionTaskPayload): Promise<RecognitionTask> {
    return notImplemented()
  }

  async getTask(_taskId: string): Promise<RecognitionTask> {
    return notImplemented()
  }
}

class HttpCaptureRepository implements CaptureRepository {
  async create(_payload: CreateCapturePayload): Promise<CaptureResult> {
    return notImplemented()
  }
}

class HttpCollectionRepository implements CollectionRepository {
  async listDiscoveredSpecies(_query: PageQuery): Promise<PageResult<DiscoveredSpeciesView>> {
    return notImplemented()
  }

  async listInstances(_query: InstanceListQuery): Promise<PageResult<InstanceCard>> {
    return notImplemented()
  }

  async getInstanceDetail(_instanceId: string): Promise<InstanceDetailView> {
    return notImplemented()
  }

  async getSpeciesDetail(_speciesId: string): Promise<SpeciesDetailView> {
    return notImplemented()
  }
}

class HttpHomeRepository implements HomeRepository {
  async getOverview(): Promise<HomeOverview> {
    return request<HomeOverview>({ url: API_ENDPOINTS.homeOverview })
  }
}

class HttpRankRepository implements RankRepository {
  async getFriendRanking(metric: RankMetric): Promise<FriendRankBoard> {
    return request<FriendRankBoard>({
      url: API_ENDPOINTS.friendRanking,
      data: { metric },
    })
  }
}

export function createHttpRepositories(): Repositories {
  return {
    species: new HttpSpeciesRepository(),
    image: new HttpImageRepository(),
    recognition: new HttpRecognitionRepository(),
    capture: new HttpCaptureRepository(),
    collection: new HttpCollectionRepository(),
    user: new HybridUserRepository(new MockUserRepository()),
    auth: new HttpAuthRepository(),
    home: new HttpHomeRepository(),
    rank: new HttpRankRepository(),
  }
}
