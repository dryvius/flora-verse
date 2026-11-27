import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/constants/app'
import { getRepositories } from '@/repositories/create-repository'
import type { PageResult, SpeciesSearchQuery } from '@/types/api'
import type { PlantSpecies } from '@/types/plant-species'

export async function searchSpecies(query?: Partial<SpeciesSearchQuery>): Promise<PageResult<PlantSpecies>> {
  return getRepositories().species.search({
    page: query?.page ?? DEFAULT_PAGE,
    pageSize: query?.pageSize ?? DEFAULT_PAGE_SIZE,
    keyword: query?.keyword,
    family: query?.family
  })
}

export async function getSpeciesById(id: string): Promise<PlantSpecies> {
  return getRepositories().species.getById(id)
}
