export interface UserProfile {
  id: string
  displayName: string
  avatarKey: string
  createdAt: string
  /** 后端账号状态。Mock 资料不包含该字段。 */
  status?: string | null
  /** 后端资产 ID。它不是 Mock 使用的图片 key。 */
  avatarAssetId?: string | null
}

export interface UserCollectionStats {
  discoveredSpeciesCount: number
  instanceCount: number
  successfulCaptureCount: number
  totalCombatPower: number
}
