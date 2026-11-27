import { InstanceStatus } from '@/enums/instance-status'
import { sumSpeciesCombatPower } from '@/repositories/mock/combat'
import { getMockDb } from '@/repositories/mock/store'
import type { UserRepository } from '@/repositories/interfaces/user-repository'
import type { UserCollectionStats, UserProfile } from '@/types/user'

export class MockUserRepository implements UserRepository {
  async getCurrentUser(): Promise<UserProfile> {
    return getMockDb().user
  }

  async getStats(): Promise<UserCollectionStats> {
    const db = getMockDb()
    const activeInstances = db.instances.filter((item) => item.status === InstanceStatus.Active)
    const discoveredSpeciesIds = [...new Set(activeInstances.map((item) => item.speciesId))]
    return {
      discoveredSpeciesCount: discoveredSpeciesIds.length,
      instanceCount: activeInstances.length,
      successfulCaptureCount: db.captures.length,
      totalCombatPower: sumSpeciesCombatPower(db.species, discoveredSpeciesIds),
    }
  }
}
