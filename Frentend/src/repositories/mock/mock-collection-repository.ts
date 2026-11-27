import { SPECIMEN_STACK_LIMIT } from '@/constants/app'
import { ERROR_CODES } from '@/constants/error-codes'
import { InstanceStatus } from '@/enums/instance-status'
import { resolveMockImageUrl } from '@/repositories/mock/image-url'
import { findSpecies, listActiveInstances, toInstanceCard } from '@/repositories/mock/mappers'
import { paginate } from '@/repositories/mock/paginate'
import { getMockDb } from '@/repositories/mock/store'
import type { CollectionRepository } from '@/repositories/interfaces/collection-repository'
import type { InstanceListQuery, PageQuery, PageResult } from '@/types/api'
import type { DiscoveredSpeciesView, InstanceCard, InstanceDetailView, SpeciesDetailView } from '@/types/views'
import { BusinessError } from '@/utils/business-error'

export class MockCollectionRepository implements CollectionRepository {
  async listDiscoveredSpecies(query: PageQuery): Promise<PageResult<DiscoveredSpeciesView>> {
    const db = getMockDb()
    const views = db.discoveries
      .filter((item) => item.instanceCount > 0)
      .sort((a, b) => (a.firstDiscoveredAt < b.firstDiscoveredAt ? 1 : -1))
      .flatMap((discovery) => {
        const species = findSpecies(db, discovery.speciesId)
        if (!species) {
          return []
        }
        const previews = listActiveInstances(db)
          .filter((item) => item.speciesId === species.id)
          .flatMap((instance) => {
            const card = toInstanceCard(db, instance)
            return card ? [card] : []
          })
          .slice(0, SPECIMEN_STACK_LIMIT)
        const view: DiscoveredSpeciesView = {
          speciesId: species.id,
          chineseName: species.chineseName,
          scientificName: species.scientificName,
          family: species.family,
          coverImageUrl: resolveMockImageUrl(db, species.representativeImageKey),
          instanceCount: discovery.instanceCount,
          firstDiscoveredAt: discovery.firstDiscoveredAt,
          previews
        }
        return [view]
      })
    return paginate(views, query.page, query.pageSize)
  }

  async listInstances(query: InstanceListQuery): Promise<PageResult<InstanceCard>> {
    const db = getMockDb()
    const cards = listActiveInstances(db)
      .filter((item) => (query.speciesId ? item.speciesId === query.speciesId : true))
      .flatMap((instance) => {
        const card = toInstanceCard(db, instance)
        return card ? [card] : []
      })
    return paginate(cards, query.page, query.pageSize)
  }

  async getInstanceDetail(instanceId: string): Promise<InstanceDetailView> {
    const db = getMockDb()
    const instance = db.instances.find((item) => item.id === instanceId && item.status === InstanceStatus.Active)
    if (!instance) {
      throw new BusinessError(ERROR_CODES.INSTANCE_NOT_FOUND, '未找到该植物个体')
    }
    const species = findSpecies(db, instance.speciesId)
    const capture = db.captures.find((item) => item.id === instance.captureId)
    if (!species || !capture) {
      throw new BusinessError(ERROR_CODES.INSTANCE_NOT_FOUND, '植物个体数据不完整')
    }
    const relatedInstances = listActiveInstances(db)
      .filter((item) => item.speciesId === species.id && item.id !== instance.id)
      .flatMap((relatedInstance) => {
        const card = toInstanceCard(db, relatedInstance)
        return card ? [card] : []
      })
    return {
      instanceId: instance.id,
      speciesId: species.id,
      chineseName: species.chineseName,
      scientificName: species.scientificName,
      family: species.family,
      genus: species.genus,
      coverImageUrl: resolveMockImageUrl(db, instance.coverImageKey),
      capturedAt: instance.capturedAt,
      discoveryType: capture.discoveryType,
      confirmationType: capture.confirmationType,
      nickname: instance.nickname,
      note: instance.note,
      relatedInstances
    }
  }

  async getSpeciesDetail(speciesId: string): Promise<SpeciesDetailView> {
    const db = getMockDb()
    const species = findSpecies(db, speciesId)
    if (!species) {
      throw new BusinessError(ERROR_CODES.SPECIES_NOT_FOUND, '未找到该植物物种')
    }
    const discovery = db.discoveries.find((item) => item.speciesId === speciesId)
    return {
      speciesId: species.id,
      chineseName: species.chineseName,
      scientificName: species.scientificName,
      commonNames: species.commonNames,
      family: species.family,
      genus: species.genus,
      description: species.description,
      characteristics: species.characteristics,
      coverImageUrl: resolveMockImageUrl(db, species.representativeImageKey),
      userInstanceCount: discovery?.instanceCount ?? 0,
      firstDiscoveredAt: discovery?.firstDiscoveredAt ?? null
    }
  }
}
