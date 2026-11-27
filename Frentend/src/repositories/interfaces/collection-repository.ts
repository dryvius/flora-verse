import type { InstanceListQuery, PageQuery, PageResult } from '@/types/api'
import type { DiscoveredSpeciesView, InstanceCard, InstanceDetailView, SpeciesDetailView } from '@/types/views'

export interface CollectionRepository {
  listDiscoveredSpecies(query: PageQuery): Promise<PageResult<DiscoveredSpeciesView>>
  listInstances(query: InstanceListQuery): Promise<PageResult<InstanceCard>>
  getInstanceDetail(instanceId: string): Promise<InstanceDetailView>
  getSpeciesDetail(speciesId: string): Promise<SpeciesDetailView>
}
