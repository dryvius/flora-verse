import type { BackendUserProfile } from '@/types/auth'
import type { UserProfile } from '@/types/user'

export function mapBackendUserProfile(user: BackendUserProfile): UserProfile {
  return {
    id: user.id,
    displayName: user.nickname ?? '',
    avatarKey: '',
    createdAt: user.createdAt,
    status: user.status,
    avatarAssetId: user.avatarAssetId
  }
}
