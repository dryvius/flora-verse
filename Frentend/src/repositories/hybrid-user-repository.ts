import { API_ENDPOINTS } from '@/api/endpoints'
import { request } from '@/api/http'
import { mapBackendUserProfile } from '@/repositories/mappers/map-backend-user'
import type { UserRepository } from '@/repositories/interfaces/user-repository'
import type { BackendUserProfile } from '@/types/auth'
import type { UserCollectionStats, UserProfile } from '@/types/user'
import { getAccessToken } from '@/utils/token-storage'

export class HybridUserRepository implements UserRepository {
  constructor(private readonly mockUsers: UserRepository) {}

  async getCurrentUser(): Promise<UserProfile> {
    if (!getAccessToken()) {
      return this.mockUsers.getCurrentUser()
    }
    const remote = await request<BackendUserProfile>({
      url: API_ENDPOINTS.usersMe,
      method: 'GET'
    })
    return mapBackendUserProfile(remote)
  }

  async getStats(): Promise<UserCollectionStats> {
    return this.mockUsers.getStats()
  }
}
