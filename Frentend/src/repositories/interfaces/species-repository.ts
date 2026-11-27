import type { PageResult, SpeciesSearchQuery } from '@/types/api'
import type { PlantSpecies } from '@/types/plant-species'

export interface SpeciesRepository {
  getById(id: string): Promise<PlantSpecies>
  search(query: SpeciesSearchQuery): Promise<PageResult<PlantSpecies>>
}
