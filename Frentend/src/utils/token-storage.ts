import { STORAGE_KEYS } from '@/constants/storage-keys'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'

export function getAccessToken(): string | null {
  const value = readStorage<string>(STORAGE_KEYS.ACCESS_TOKEN)
  if (typeof value !== 'string') {
    return null
  }
  const token = value.trim()
  if (!token) {
    return null
  }
  return token
}

export function setAccessToken(token: string): void {
  writeStorage(STORAGE_KEYS.ACCESS_TOKEN, token)
}

export function clearAccessToken(): void {
  removeStorage(STORAGE_KEYS.ACCESS_TOKEN)
}
