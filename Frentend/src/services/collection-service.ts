import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/app'
import { getRepositories } from '@/repositories/create-repository'
import type { InstanceListQuery, PageQuery, PageResult } from '@/types/api'
import type {
  CodexProgress,
  DiscoveredSpeciesView,
  InstanceCollectionGroup,
  InstanceCard,
  InstanceDetailView,
  SpeciesDetailView
} from '@/types/views'

export async function listDiscoveredSpecies(query?: Partial<PageQuery>): Promise<PageResult<DiscoveredSpeciesView>> {
  return getRepositories().collection.listDiscoveredSpecies({
    page: query?.page ?? DEFAULT_PAGE,
    pageSize: query?.pageSize ?? DEFAULT_PAGE_SIZE
  })
}

export async function listInstances(query?: Partial<InstanceListQuery>): Promise<PageResult<InstanceCard>> {
  return getRepositories().collection.listInstances({
    page: query?.page ?? DEFAULT_PAGE,
    pageSize: query?.pageSize ?? DEFAULT_PAGE_SIZE,
    speciesId: query?.speciesId
  })
}

export async function getSpeciesDetail(speciesId: string): Promise<SpeciesDetailView> {
  return getRepositories().collection.getSpeciesDetail(speciesId)
}

export async function getInstanceDetail(instanceId: string): Promise<InstanceDetailView> {
  return getRepositories().collection.getInstanceDetail(instanceId)
}

export function groupInstancesBySpecies(items: InstanceCard[]): InstanceCollectionGroup[] {
  const groups = new Map<string, InstanceCard[]>()
  for (const item of items) {
    const current = groups.get(item.speciesId)
    if (!current) {
      groups.set(item.speciesId, [item])
      continue
    }
    current.push(item)
  }
  return Array.from(groups.values()).flatMap((groupItems): InstanceCollectionGroup[] => {
    const latestInstance = groupItems[0]
    if (!latestInstance) {
      return []
    }
    return [{
      speciesId: latestInstance.speciesId,
      chineseName: latestInstance.chineseName,
      scientificName: latestInstance.scientificName,
      family: latestInstance.family,
      latestInstance,
      instanceCount: groupItems.length
    }]
  })
}

export async function getCodexProgress(): Promise<CodexProgress> {
  const repositories = getRepositories()
  const [discovered, catalog] = await Promise.all([
    repositories.collection.listDiscoveredSpecies({
      page: DEFAULT_PAGE,
      pageSize: 1
    }),
    repositories.species.search({
      page: DEFAULT_PAGE,
      pageSize: 1
    })
  ])
  return {
    unlockedCount: discovered.total,
    catalogCount: catalog.total
  }
}
