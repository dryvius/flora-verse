import type { ConfirmationType } from '@/enums/confirmation-type'
import type { DiscoveryType } from '@/enums/discovery-type'
import type { LocationMode } from '@/enums/location-mode'

export interface LocationData {
  longitude: number
  latitude: number
  accuracy: number | null
}

export interface PlantCapture {
  id: string
  userId: string
  recognitionTaskId: string | null
  speciesId: string
  instanceId: string
  imageKey: string
  capturedAt: string
  discoveryType: DiscoveryType
  confirmationType: ConfirmationType
  locationMode: LocationMode
  locationData: LocationData | null
  idempotencyKey: string
  createdAt: string
}

export interface CreateCapturePayload {
  recognitionTaskId: string
  speciesId: string
  confirmationType: ConfirmationType
  imageKey: string
  idempotencyKey: string
}

export interface CaptureResult {
  capture: PlantCapture
  instance: PlantInstanceViewRef
  species: SpeciesSummary
  isFirstDiscovery: boolean
}

export interface PlantInstanceViewRef {
  id: string
  coverImageKey: string
  capturedAt: string
}

export interface SpeciesSummary {
  id: string
  chineseName: string
  scientificName: string
  family: string
  genus: string
}
