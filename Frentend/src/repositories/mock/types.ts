import type { UserSpeciesDiscovery } from '@/types/collection'
import type { FriendExplorer } from '@/types/friend'
import type { PlantCapture } from '@/types/plant-capture'
import type { PlantInstance } from '@/types/plant-instance'
import type { PlantSpecies, PlantSpeciesAlias } from '@/types/plant-species'
import type { RecognitionTask } from '@/types/recognition'
import type { UserProfile } from '@/types/user'

export interface MockImageRecord {
  imageKey: string
  localPath: string
}

export interface RecognitionSimulation {
  completeAt: number
  shouldFail: boolean
}

export interface MockDatabase {
  version: number
  user: UserProfile
  friends: FriendExplorer[]
  species: PlantSpecies[]
  aliases: PlantSpeciesAlias[]
  instances: PlantInstance[]
  captures: PlantCapture[]
  tasks: RecognitionTask[]
  discoveries: UserSpeciesDiscovery[]
  images: MockImageRecord[]
  simulations: Record<string, RecognitionSimulation>
}
