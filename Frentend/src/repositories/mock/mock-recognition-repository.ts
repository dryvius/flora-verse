import { DEMO_USER_ID, MOCK_RECOGNITION_DELAY_MS } from '@/constants/app'
import { ERROR_CODES } from '@/constants/error-codes'
import { RecognitionStatus } from '@/enums/recognition-status'
import { delay } from '@/repositories/mock/delay'
import { getMockDb, mutateMockDb } from '@/repositories/mock/store'
import type { RecognitionRepository } from '@/repositories/interfaces/recognition-repository'
import type { CreateRecognitionTaskPayload, RecognitionCandidate, RecognitionTask } from '@/types/recognition'
import { BusinessError } from '@/utils/business-error'
import { nowIso } from '@/utils/date'
import { hashString } from '@/utils/hash'
import { createId } from '@/utils/id'

function buildCandidates(imageKey: string): RecognitionCandidate[] {
  const list = getMockDb().species
  if (list.length === 0) {
    return []
  }
  const start = hashString(imageKey) % list.length
  const candidates: RecognitionCandidate[] = []
  for (let offset = 0; offset < 3; offset += 1) {
    const species = list[(start + offset) % list.length]
    if (!species) {
      continue
    }
    candidates.push({
      speciesId: species.id,
      scientificName: species.scientificName,
      chineseName: species.chineseName,
      family: species.family,
      genus: species.genus,
      confidence: offset === 0 ? 0.86 : offset === 1 ? 0.41 : 0.22,
      rank: offset + 1,
      matchedBy: 'mock-visual-hash'
    })
  }
  return candidates
}

function finalizeTask(task: RecognitionTask): RecognitionTask {
  const simulation = getMockDb().simulations[task.id]
  if (!simulation || Date.now() < simulation.completeAt) {
    return task
  }
  if (task.status === RecognitionStatus.Succeeded || task.status === RecognitionStatus.Failed) {
    return task
  }

  const finishedAt = nowIso()
  const shouldFail = simulation.shouldFail
  const nextTask: RecognitionTask = {
    ...task,
    status: shouldFail ? RecognitionStatus.Failed : RecognitionStatus.Succeeded,
    candidates: shouldFail ? [] : buildCandidates(task.imageKey),
    errorCode: shouldFail ? ERROR_CODES.RECOGNITION_FAILED : null,
    errorMessage: shouldFail ? '未能从照片中识别出可信物种，请重拍或换一张更清晰的植物主体照片' : null,
    finishedAt
  }

  mutateMockDb((db) => {
    db.tasks = db.tasks.map((item) => (item.id === task.id ? nextTask : item))
  })
  return nextTask
}

export class MockRecognitionRepository implements RecognitionRepository {
  async createTask(payload: CreateRecognitionTaskPayload): Promise<RecognitionTask> {
    const createdAt = nowIso()
    const task: RecognitionTask = {
      id: createId('task'),
      userId: DEMO_USER_ID,
      imageKey: payload.imageKey,
      provider: 'floraverse-mock',
      modelVersion: 'mock-v1',
      status: RecognitionStatus.Processing,
      candidates: [],
      errorCode: null,
      errorMessage: null,
      startedAt: createdAt,
      finishedAt: null,
      createdAt
    }
    const shouldFail = payload.imageKey.toLowerCase().includes('fail')
    mutateMockDb((db) => {
      db.tasks.push(task)
      db.simulations[task.id] = {
        completeAt: Date.now() + MOCK_RECOGNITION_DELAY_MS,
        shouldFail
      }
    })
    await delay(120)
    return task
  }

  async getTask(taskId: string): Promise<RecognitionTask> {
    const task = getMockDb().tasks.find((item) => item.id === taskId)
    if (!task) {
      throw new BusinessError(ERROR_CODES.TASK_NOT_FOUND, '识别任务不存在')
    }
    return finalizeTask(task)
  }
}
