import { CAMP_RECENT_RAIL_LIMIT } from '@/constants/app'
import { applyClimateCombatBonus, resolveCampWeatherStation } from '@/constants/camp-climate'
import { findSpecies, listActiveInstances, toInstanceCard } from '@/repositories/mock/mappers'
import { getMockDb } from '@/repositories/mock/store'
import type { HomeRepository } from '@/repositories/interfaces/home-repository'
import type { CampFeaturedPlant, HomeOverview, InstanceCard } from '@/types/views'

export class MockHomeRepository implements HomeRepository {
  async getOverview(): Promise<HomeOverview> {
    const db = getMockDb()
    const now = new Date()
    const weatherStation = resolveCampWeatherStation(now)
    const instances = listActiveInstances(db)
    const discoveredSpeciesIds = new Set(instances.map((item) => item.speciesId))

    const featuredPlant = resolveFeaturedPlant(instances, weatherStation.bonusPercent, weatherStation.locationLabel)
    const recentInstances = resolveRecentRail(instances, featuredPlant?.instanceId ?? null)

    return {
      userDisplayName: db.user.displayName,
      discoveredSpeciesCount: discoveredSpeciesIds.size,
      instanceCount: instances.length,
      catalogSpeciesTotal: db.species.length,
      weatherStation,
      featuredPlant,
      recentInstances
    }
  }
}

function resolveFeaturedPlant(
  instances: ReturnType<typeof listActiveInstances>,
  bonusPercent: number,
  locationLabel: string
): CampFeaturedPlant | null {
  const db = getMockDb()
  if (instances.length === 0) {
    return null
  }

  let featured = instances[0]!
  let featuredPower = findSpecies(db, featured.speciesId)?.baseCombatPower ?? 0

  for (const instance of instances) {
    const power = findSpecies(db, instance.speciesId)?.baseCombatPower ?? 0
    if (power > featuredPower) {
      featured = instance
      featuredPower = power
    }
  }

  const species = findSpecies(db, featured.speciesId)
  const card = toInstanceCard(db, featured)
  if (!species || !card) {
    return null
  }

  return {
    instanceId: featured.id,
    speciesId: species.id,
    chineseName: species.chineseName,
    scientificName: species.scientificName,
    family: species.family,
    coverImageUrl: card.coverImageUrl,
    baseCombatPower: species.baseCombatPower,
    effectiveCombatPower: applyClimateCombatBonus(species.baseCombatPower, bonusPercent),
    bonusPercent,
    statusLabel: bonusPercent > 0 ? '生长优良' : '稳态观察',
    locationLabel,
    capturedAt: featured.capturedAt
  }
}

function resolveRecentRail(
  instances: ReturnType<typeof listActiveInstances>,
  featuredInstanceId: string | null
): InstanceCard[] {
  const db = getMockDb()
  const seenSpecies = new Set<string>()
  const cards: InstanceCard[] = []

  for (const instance of instances) {
    if (featuredInstanceId && instance.id === featuredInstanceId) {
      continue
    }
    if (seenSpecies.has(instance.speciesId)) {
      continue
    }
    const card = toInstanceCard(db, instance)
    if (!card) {
      continue
    }
    seenSpecies.add(instance.speciesId)
    cards.push(card)
    if (cards.length >= CAMP_RECENT_RAIL_LIMIT) {
      break
    }
  }

  return cards
}
