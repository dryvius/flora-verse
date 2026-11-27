import { DataSource } from '@/enums/data-source'
import { createHttpRepositories } from '@/repositories/http'
import { createMockRepositories } from '@/repositories/mock'
import { initMockDatabase } from '@/repositories/mock/store'
import type { Repositories } from '@/repositories/interfaces/repositories'

let cached: Repositories | null = null

function getDataSource(): DataSource {
  return import.meta.env.VITE_DATA_SOURCE === DataSource.Http ? DataSource.Http : DataSource.Mock
}

export async function bootstrapDataLayer(): Promise<void> {
  if (getDataSource() === DataSource.Mock) {
    await initMockDatabase()
  }
  cached = getDataSource() === DataSource.Http ? createHttpRepositories() : createMockRepositories()
}

export function getRepositories(): Repositories {
  if (!cached) {
    cached = getDataSource() === DataSource.Http ? createHttpRepositories() : createMockRepositories()
  }
  return cached
}
