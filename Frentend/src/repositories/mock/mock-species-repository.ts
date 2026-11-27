import { ERROR_CODES } from '@/constants/error-codes'
import { paginate } from '@/repositories/mock/paginate'
import { getMockDb } from '@/repositories/mock/store'
import type { SpeciesRepository } from '@/repositories/interfaces/species-repository'
import type { PageResult, SpeciesSearchQuery } from '@/types/api'
import type { PlantSpecies } from '@/types/plant-species'
import { BusinessError } from '@/utils/business-error'

export class MockSpeciesRepository implements SpeciesRepository {
  async getById(id: string): Promise<PlantSpecies> {
    const species = getMockDb().species.find((item) => item.id === id)
    if (!species) {
      throw new BusinessError(ERROR_CODES.SPECIES_NOT_FOUND, '未找到该植物物种')
    }
    return species
  }

  async search(query: SpeciesSearchQuery): Promise<PageResult<PlantSpecies>> {
    const keyword = (query.keyword ?? '').trim().toLowerCase()
    const family = (query.family ?? '').trim()
    const db = getMockDb()
    const filtered = db.species.filter((species) => {
      const familyMatched = family ? species.family === family : true
      if (!keyword) {
        return familyMatched
      }
      const aliasMatched = db.aliases.some(
        (alias) => alias.speciesId === species.id && alias.alias.toLowerCase().includes(keyword)
      )
      const text = `${species.chineseName} ${species.scientificName} ${species.commonNames.join(' ')}`.toLowerCase()
      return familyMatched && (text.includes(keyword) || aliasMatched)
    })
    return paginate(filtered, query.page, query.pageSize)
  }
}
