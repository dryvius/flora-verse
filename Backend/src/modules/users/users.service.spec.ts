import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStatus } from '../../generated/prisma/enums.js';
import type { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { UsersService } from './users.service.js';
import type { UserProfile } from './users.types.js';

const USER_ID = 'usr_demo_001';
const CREATED_AT = new Date('2026-11-26T03:00:00.000Z');
const REQUESTED_NICKNAME = '青苔';
const STORED_NICKNAME = '苔痕';
const SUPPLEMENTARY_CODE_POINT = '\u{1F331}';

const PROFILE_SELECT = {
  id: true,
  nickname: true,
  avatarAssetId: true,
  status: true,
  createdAt: true,
} as const;

const PROFILE_KEYS = [
  'id',
  'nickname',
  'avatarAssetId',
  'status',
  'createdAt',
] as const;

interface ProfileRow extends UserProfile {
  updatedAt?: Date;
  deletionRequestedAt?: Date | null;
}

function createRow(status: UserStatus, nickname = '摘星重现'): ProfileRow {
  return {
    id: USER_ID,
    nickname,
    avatarAssetId: 'ast_avatar_001',
    status,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletionRequestedAt: null,
  };
}

function createService(row: ProfileRow | null): {
  service: UsersService;
  findUnique: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
} {
  const findUnique = vi.fn().mockResolvedValue(row);
  const updateMany = vi.fn().mockResolvedValue({
    count: row?.status === UserStatus.ACTIVE ? 1 : 0,
  });
  const update = vi.fn();
  const prisma = {
    user: { findUnique, updateMany, update },
  };
  return {
    service: new UsersService(prisma as unknown as PrismaService),
    findUnique,
    updateMany,
    update,
  };
}

function expectActiveNicknameUpdate(
  updateMany: ReturnType<typeof vi.fn>,
  nickname: string,
): void {
  expect(updateMany).toHaveBeenCalledTimes(1);
  const call: unknown = updateMany.mock.calls[0]?.[0];
  expect(call).toEqual({
    where: {
      id: USER_ID,
      status: UserStatus.ACTIVE,
    },
    data: { nickname },
  });
  if (!isRecord(call) || !isRecord(call.data) || !isRecord(call.where)) {
    throw new Error('Expected Prisma updateMany arguments');
  }
  expect(Object.keys(call.data)).toEqual(['nickname']);
  expect(call.where.status).toBe(UserStatus.ACTIVE);
}

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('returns a user profile when the user exists', async () => {
      const { service, findUnique } = createService(
        createRow(UserStatus.ACTIVE),
      );

      const result = await service.findById(USER_ID);

      expect(result).toEqual({
        id: USER_ID,
        nickname: '摘星重现',
        avatarAssetId: 'ast_avatar_001',
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      });
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: PROFILE_SELECT,
      });
    });

    it('returns null when the user does not exist', async () => {
      const { service } = createService(null);

      await expect(service.findById(USER_ID)).resolves.toBeNull();
    });

    it('does not expose fields outside the user profile', async () => {
      const { service } = createService(createRow(UserStatus.ACTIVE));

      const result = await service.findById(USER_ID);

      expect(result).not.toBeNull();
      expect(Object.keys(result ?? {}).sort()).toEqual(
        [...PROFILE_KEYS].sort(),
      );
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('deletionRequestedAt');
    });
  });

  describe('requireActiveById', () => {
    it('returns the active profile loaded by primary key', async () => {
      const row = {
        ...createRow(UserStatus.ACTIVE),
        passwordHash: 'secret-hash',
        providerSubject: 'flora-user',
        authIdentities: [{ providerSubject: 'flora-user' }],
      };
      const { service, findUnique } = createService(row);

      const result = await service.requireActiveById(USER_ID);

      expect(result).toEqual({
        id: USER_ID,
        nickname: '摘星重现',
        avatarAssetId: 'ast_avatar_001',
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      });
      expect(Object.keys(result).sort()).toEqual([...PROFILE_KEYS].sort());
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('providerSubject');
      expect(result).not.toHaveProperty('authIdentities');
      expect(result).not.toHaveProperty('deletionRequestedAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: PROFILE_SELECT,
      });
      const call: unknown = findUnique.mock.calls[0]?.[0];
      expect(JSON.stringify(call)).not.toContain('passwordHash');
      expect(JSON.stringify(call)).not.toContain('providerSubject');
      expect(JSON.stringify(call)).not.toContain('authIdentities');
    });

    it('rejects a missing user', async () => {
      const { service, findUnique } = createService(null);

      const error = await captureError(service.requireActiveById(USER_ID));

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(readExceptionCode(error)).toBe('UNAUTHORIZED');
      expect(readStatus(error)).toBe(401);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: PROFILE_SELECT,
      });
    });

    it.each([
      UserStatus.DISABLED,
      UserStatus.PENDING_DELETION,
      UserStatus.DELETED,
    ])('rejects a %s user', async (status) => {
      const { service, findUnique, updateMany } = createService(
        createRow(status),
      );

      const error = await captureError(service.requireActiveById(USER_ID));

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error).not.toBeInstanceOf(ForbiddenException);
      expect(readExceptionCode(error)).toBe('USER_NOT_ACTIVE');
      expect(readStatus(error)).toBe(401);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: PROFILE_SELECT,
      });
      expect(updateMany).not.toHaveBeenCalled();
    });
  });

  describe('updateNickname', () => {
    it('returns the profile loaded after a conditional update', async () => {
      const { service, findUnique, updateMany, update } = createService(
        createRow(UserStatus.ACTIVE, STORED_NICKNAME),
      );

      const result = await service.updateNickname(USER_ID, REQUESTED_NICKNAME);

      expect(result).toEqual({
        id: USER_ID,
        nickname: STORED_NICKNAME,
        avatarAssetId: 'ast_avatar_001',
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      });
      expect(result.nickname).not.toBe(REQUESTED_NICKNAME);
      expect(Object.keys(result).sort()).toEqual([...PROFILE_KEYS].sort());
      expectActiveNicknameUpdate(updateMany, REQUESTED_NICKNAME);
      expect(updateMany).toHaveBeenCalledBefore(findUnique);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: USER_ID },
        select: PROFILE_SELECT,
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('throws when the conditional update matches no user', async () => {
      const { service, updateMany, update } = createService(null);

      await expect(
        service.updateNickname(USER_ID, REQUESTED_NICKNAME),
      ).rejects.toBeInstanceOf(NotFoundException);
      expectActiveNicknameUpdate(updateMany, REQUESTED_NICKNAME);
      expect(update).not.toHaveBeenCalled();
    });

    it.each([
      UserStatus.DISABLED,
      UserStatus.PENDING_DELETION,
      UserStatus.DELETED,
    ])('rejects nickname updates while the user is %s', async (status) => {
      const { service, updateMany, update } = createService(createRow(status));

      await expect(
        service.updateNickname(USER_ID, REQUESTED_NICKNAME),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expectActiveNicknameUpdate(updateMany, REQUESTED_NICKNAME);
      expect(update).not.toHaveBeenCalled();
    });

    it('accepts 64 supplementary-plane characters whose UTF-16 length exceeds 64', async () => {
      const nickname = SUPPLEMENTARY_CODE_POINT.repeat(64);
      expect([...nickname].length).toBe(64);
      expect(nickname.length).toBe(128);

      const { service, updateMany } = createService(
        createRow(UserStatus.ACTIVE, STORED_NICKNAME),
      );

      const result = await service.updateNickname(USER_ID, nickname);

      expect(result.nickname).toBe(STORED_NICKNAME);
      expectActiveNicknameUpdate(updateMany, nickname);
    });

    it('rejects 65 supplementary-plane characters', async () => {
      const nickname = SUPPLEMENTARY_CODE_POINT.repeat(65);
      expect([...nickname].length).toBe(65);
      expect(nickname.length).toBe(130);

      const { service, updateMany, findUnique } = createService(
        createRow(UserStatus.ACTIVE),
      );

      await expect(
        service.updateNickname(USER_ID, nickname),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(updateMany).not.toHaveBeenCalled();
      expect(findUnique).not.toHaveBeenCalled();
    });
  });
});

function captureError(run: Promise<unknown>): Promise<unknown> {
  return run.then(
    () => {
      throw new Error('Expected the service to throw');
    },
    (error: unknown) => error,
  );
}

function readStatus(error: unknown): number {
  if (!(error instanceof UnauthorizedException)) {
    throw new Error('Expected an unauthorized exception');
  }
  return error.getStatus();
}

function readExceptionCode(error: unknown): string {
  if (!(error instanceof UnauthorizedException)) {
    throw new Error('Expected an unauthorized exception');
  }
  const response: unknown = error.getResponse();
  if (!isRecord(response) || typeof response.code !== 'string') {
    throw new Error('Expected an exception code');
  }
  return response.code;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
