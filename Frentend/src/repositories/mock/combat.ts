import type { PlantSpecies } from '@/types/plant-species'

export function sumSpeciesCombatPower(species: PlantSpecies[], speciesIds: Iterable<string>): number {
  const powerById = new Map(species.map((item) => [item.id, item.baseCombatPower]))
  let total = 0
  for (const speciesId of speciesIds) {
    total += powerById.get(speciesId) ?? 0
  }
  return total
}
