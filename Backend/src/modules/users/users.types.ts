import type { UserStatus } from '../../generated/prisma/enums.js';

export interface UserProfile {
  id: string;
  nickname: string | null;
  avatarAssetId: string | null;
  status: UserStatus;
  createdAt: Date;
}

export interface UserProfileRecord {
  id: string;
  nickname: string | null;
  avatarAssetId: string | null;
  status: UserStatus;
  createdAt: Date;
}

export function toUserProfile(record: UserProfileRecord): UserProfile {
  return {
    id: record.id,
    nickname: record.nickname,
    avatarAssetId: record.avatarAssetId,
    status: record.status,
    createdAt: record.createdAt,
  };
}
