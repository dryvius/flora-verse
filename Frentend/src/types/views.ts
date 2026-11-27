import type { CampWeather } from '@/enums/camp-weather'
import type { ConfirmationType } from '@/enums/confirmation-type'
import type { DiscoveryType } from '@/enums/discovery-type'
import type { PlantCharacteristics } from '@/types/plant-species'

export interface InstanceCard {
  instanceId: string
  speciesId: string
  chineseName: string
  scientificName: string
  family: string
  coverImageUrl: string
  capturedAt: string
  discoveryType: DiscoveryType
}

export interface CodexProgress {
  unlockedCount: number
  catalogCount: number
}

export interface DiscoveredSpeciesView {
  speciesId: string
  chineseName: string
  scientificName: string
  family: string
  coverImageUrl: string
  instanceCount: number
  firstDiscoveredAt: string
  previews: InstanceCard[]
}

export interface InstanceCollectionGroup {
  speciesId: string
  chineseName: string
  scientificName: string
  family: string
  latestInstance: InstanceCard
  instanceCount: number
}

export interface CampWeatherStation {
  seasonLabel: string
  weather: CampWeather
  weatherLabel: string
  temperatureC: number
  bonusPercent: number
  bonusLabel: string
  atmosphereHint: string
  locationLabel: string
}

export interface CampFeaturedPlant {
  instanceId: string
  speciesId: string
  chineseName: string
  scientificName: string
  family: string
  coverImageUrl: string
  baseCombatPower: number
  effectiveCombatPower: number
  bonusPercent: number
  statusLabel: string
  locationLabel: string
  capturedAt: string
}

export interface HomeOverview {
  userDisplayName: string
  discoveredSpeciesCount: number
  instanceCount: number
  catalogSpeciesTotal: number
  weatherStation: CampWeatherStation
  featuredPlant: CampFeaturedPlant | null
  recentInstances: InstanceCard[]
}

export interface SpeciesDetailView {
  speciesId: string
  chineseName: string
  scientificName: string
  commonNames: string[]
  family: string
  genus: string
  description: string
  characteristics: PlantCharacteristics
  coverImageUrl: string
  userInstanceCount: number
  firstDiscoveredAt: string | null
}

export interface InstanceDetailView {
  instanceId: string
  speciesId: string
  chineseName: string
  scientificName: string
  family: string
  genus: string
  coverImageUrl: string
  capturedAt: string
  discoveryType: DiscoveryType
  confirmationType: ConfirmationType
  nickname: string | null
  note: string | null
  relatedInstances: InstanceCard[]
}

export interface CaptureSuccessView {
  instanceId: string
  speciesId: string
  chineseName: string
  scientificName: string
  coverImageUrl: string
  capturedAt: string
  discoveryType: DiscoveryType
  collectionCode: string
}
