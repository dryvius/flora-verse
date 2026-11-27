import { STORAGE_KEYS } from '@/constants/storage-keys'
import { ERROR_CODES } from '@/constants/error-codes'
import { createSeedDatabase } from '@/repositories/mock/seed'
import type { MockDatabase } from '@/repositories/mock/types'
import { BusinessError } from '@/utils/business-error'
import { readStorage, writeStorage } from '@/utils/storage'

const MOCK_DB_VERSION = 2
let memoryDb: MockDatabase | null = null

function cloneDb(db: MockDatabase): MockDatabase {
  return JSON.parse(JSON.stringify(db)) as MockDatabase
}

function loadOrCreateDatabase(): MockDatabase {
  const stored = readStorage<MockDatabase>(STORAGE_KEYS.MOCK_DATABASE)
  if (stored && stored.version === MOCK_DB_VERSION && stored.user && stored.species.length > 0) {
    return stored
  }
  const seeded = createSeedDatabase()
  writeStorage(STORAGE_KEYS.MOCK_DATABASE, seeded)
  return seeded
}

export async function initMockDatabase(): Promise<void> {
  if (!memoryDb) {
    memoryDb = loadOrCreateDatabase()
  }
}

export function getMockDb(): MockDatabase {
  if (!memoryDb) {
    memoryDb = loadOrCreateDatabase()
  }
  if (!memoryDb) {
    throw new BusinessError(ERROR_CODES.MOCK_NOT_INITIALIZED, '本地数据尚未初始化')
  }
  return memoryDb
}

export function mutateMockDb(mutator: (db: MockDatabase) => void): MockDatabase {
  const db = cloneDb(getMockDb())
  mutator(db)
  memoryDb = db
  persistMockDatabase()
  return db
}

function persistMockDatabase(): void {
  if (!memoryDb) {
    return
  }
  writeStorage(STORAGE_KEYS.MOCK_DATABASE, memoryDb)
}
