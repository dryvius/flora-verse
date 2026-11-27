export function readStorage<T>(key: string): T | null {
  const value = uni.getStorageSync(key)
  if (value === '' || value === undefined || value === null) {
    return null
  }
  return value as T
}

export function writeStorage<T>(key: string, value: T): void {
  uni.setStorageSync(key, value)
}

export function removeStorage(key: string): void {
  uni.removeStorageSync(key)
}
