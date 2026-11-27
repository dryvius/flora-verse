import type { CreateRecognitionTaskPayload, RecognitionTask } from '@/types/recognition'

export interface RecognitionRepository {
  createTask(payload: CreateRecognitionTaskPayload): Promise<RecognitionTask>
  getTask(taskId: string): Promise<RecognitionTask>
}
