export interface BackendUserProfile {
  id: string
  nickname: string | null
  avatarAssetId: string | null
  status: string
  createdAt: string
}

export interface RegisterPayload {
  username: string
  password: string
  nickname?: string | null
}

export interface RegisterResult {
  user: BackendUserProfile
  username: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: BackendUserProfile
  username: string
}
