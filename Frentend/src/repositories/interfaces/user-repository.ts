import type { UserCollectionStats, UserProfile } from '@/types/user'

export interface UserRepository {
  getCurrentUser(): Promise<UserProfile>
  getStats(): Promise<UserCollectionStats>
}
