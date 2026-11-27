import type { AliasType } from '@/enums/alias-type'
import type { ReviewStatus } from '@/enums/review-status'

export interface PlantCharacteristics {
  leafShape: string
  typicalHeight: string
  notableFeatures: string[]
}

export interface PlantSpecies {
  id: string
  scientificName: string
  chineseName: string
  commonNames: string[]
  family: string
  genus: string
  taxonomySource: string
  taxonomyVersion: string
  description: string
  characteristics: PlantCharacteristics
  /** 物种基础战斗数值，用于好友综合战斗力排行 */
  baseCombatPower: number
  representativeImageKey: string
  reviewStatus: ReviewStatus
  createdAt: string
  updatedAt: string
}

export interface PlantSpeciesAlias {
  id: string
  speciesId: string
  alias: string
  language: string
  aliasType: AliasType
  source: string
}
