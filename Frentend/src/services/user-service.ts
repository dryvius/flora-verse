import { getRepositories } from '@/repositories/create-repository'
import type { UserCollectionStats, UserProfile } from '@/types/user'

export async function getCurrentUser(): Promise<UserProfile> {
  return getRepositories().user.getCurrentUser()
}

export async function getUserStats(): Promise<UserCollectionStats> {
  return getRepositories().user.getStats()
}
