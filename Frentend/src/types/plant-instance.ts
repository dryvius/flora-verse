import type { InstanceStatus } from '@/enums/instance-status'

export interface PlantInstance {
  id: string
  userId: string
  speciesId: string
  captureId: string
  nickname: string | null
  coverImageKey: string
  note: string | null
  status: InstanceStatus
  capturedAt: string
  createdAt: string
  updatedAt: string
}
