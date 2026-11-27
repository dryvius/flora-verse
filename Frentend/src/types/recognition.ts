import type { RecognitionStatus } from '@/enums/recognition-status'

export interface RecognitionCandidate {
  speciesId: string
  scientificName: string
  chineseName: string
  family: string
  genus: string
  confidence: number | null
  rank: number
  matchedBy: string
}

export interface RecognitionTask {
  id: string
  userId: string
  imageKey: string
  provider: string
  modelVersion: string | null
  status: RecognitionStatus
  candidates: RecognitionCandidate[]
  errorCode: string | null
  errorMessage: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

export interface CreateRecognitionTaskPayload {
  imageKey: string
}
