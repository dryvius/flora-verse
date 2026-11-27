import type { CaptureResult, CreateCapturePayload } from '@/types/plant-capture'

export interface CaptureRepository {
  create(payload: CreateCapturePayload): Promise<CaptureResult>
}
