import { DiscoveryType } from '@/enums/discovery-type'
import { InstanceStatus } from '@/enums/instance-status'
import { resolveMockImageUrl } from '@/repositories/mock/image-url'
import type { MockDatabase } from '@/repositories/mock/types'
import type { PlantInstance } from '@/types/plant-instance'
import type { PlantSpecies } from '@/types/plant-species'
import type { InstanceCard } from '@/types/views'

export function findSpecies(db: MockDatabase, speciesId: string): PlantSpecies | null {
  return db.species.find((item) => item.id === speciesId) ?? null
}

export function listActiveInstances(db: MockDatabase): PlantInstance[] {
  return db.instances
    .filter((item) => item.status === InstanceStatus.Active)
    .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))
}

export function toInstanceCard(db: MockDatabase, instance: PlantInstance): InstanceCard | null {
  const species = findSpecies(db, instance.speciesId)
  if (!species) {
    return null
  }
  const capture = db.captures.find((item) => item.id === instance.captureId)
  const discovery = db.discoveries.find((item) => item.speciesId === instance.speciesId)
  const discoveryType =
    capture?.discoveryType ??
    (discovery?.firstInstanceId === instance.id ? DiscoveryType.First : DiscoveryType.Repeat)

  return {
    instanceId: instance.id,
    speciesId: species.id,
    chineseName: species.chineseName,
    scientificName: species.scientificName,
    family: species.family,
    coverImageUrl: resolveMockImageUrl(db, instance.coverImageKey),
    capturedAt: instance.capturedAt,
    discoveryType
  }
}
