import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, UserStatus } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AuthService, DUMMY_ARGON2ID_PASSWORD_HASH } from './auth.service.js';
import { ACCESS_TOKEN_EXPIRES_IN_SECONDS } from './services/access-token.service.js';
import type { AccessTokenService } from './services/access-token.service.js';
import type { PasswordHasherService } from './services/password-hasher.service.js';

const CREATED_AT = new Date('2026-11-26T06:00:00.000Z');
const PASSWORD = 'Flora@2026';
const PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$salt$hash';

function usernameConflict(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.10.1',
    meta: {
      modelName: 'AuthIdentity',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
          constraint: {
            index: 'auth_identities_provider_providerSubject_key',
          },
        },
      },
    },
  });
}

function usernameIndexOnOtherModel(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.10.1',
    meta: {
      modelName: 'User',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
          constraint: {
            index: 'auth_identities_provider_providerSubject_key',
          },
        },
      },
    },
  });
}

function primaryKeyConflict(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.10.1',
    meta: {
      modelName: 'User',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
          constraint: { index: 'PRIMARY' },
        },
      },
    },
  });
}

describe('AuthService.register', () => {
  const events: string[] = [];
  const hash = vi.fn();
  const userCreate = vi.fn();
  const identityCreate = vi.fn();
  const transaction = vi.fn();

  const service = new AuthService(
    { $transaction: transaction } as unknown as PrismaService,
    { hash } as unknown as PasswordHasherService,
    { issue: vi.fn() } as unknown as AccessTokenService,
  );

  beforeEach(() => {
    events.length = 0;
    hash.mockReset();
    userCreate.mockReset();
    identityCreate.mockReset();
    transaction.mockReset();
    hash.mockImplementation((password: string) => {
      events.push(`hash:${password}`);
      return Promise.resolve(PASSWORD_HASH);
    });
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      events.push('transaction');
      return callback({
        user: { create: userCreate },
        authIdentity: { create: identityCreate },
      });
    });
  });

  it('creates an active user and password identity outside the hash step', async () => {
    userCreate.mockResolvedValue({
      id: 'usr_new',
      nickname: '星辰',
      avatarAssetId: null,
      status: UserStatus.ACTIVE,
      createdAt: CREATED_AT,
      passwordHash: PASSWORD_HASH,
    });
    identityCreate.mockResolvedValue({ id: 'idn_new' });

    const result = await service.register({
      username: '  Cafe\u0301xy  ',
      password: PASSWORD,
      nickname: '星辰',
    });

    expect(events).toEqual([`hash:${PASSWORD}`, 'transaction']);
    expect(hash).toHaveBeenCalledWith(PASSWORD);
    expect(userCreate).toHaveBeenCalledWith({
      data: { status: UserStatus.ACTIVE, nickname: '星辰' },
      select: {
        id: true,
        nickname: true,
        avatarAssetId: true,
        status: true,
        createdAt: true,
      },
    });
    expect(identityCreate).toHaveBeenCalledWith({
      data: {
        userId: 'usr_new',
        provider: AuthProvider.PASSWORD,
        providerSubject: 'Caféxy',
        passwordHash: PASSWORD_HASH,
        unionId: null,
      },
    });
    expect(result).toEqual({
      user: {
        id: 'usr_new',
        nickname: '星辰',
        avatarAssetId: null,
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      },
      username: 'Caféxy',
    });
    expect(JSON.stringify(result)).not.toContain(PASSWORD);
    expect(JSON.stringify(result)).not.toContain(PASSWORD_HASH);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('stores a null nickname when it is omitted', async () => {
    userCreate.mockResolvedValue({
      id: 'usr_new',
      nickname: null,
      avatarAssetId: null,
      status: UserStatus.ACTIVE,
      createdAt: CREATED_AT,
    });
    identityCreate.mockResolvedValue({ id: 'idn_new' });

    const result = await service.register({
      username: 'FloraOne',
      password: PASSWORD,
    });

    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: UserStatus.ACTIVE, nickname: null },
      }),
    );
    expect(result.user.nickname).toBeNull();
  });

  it('registers different usernames independently', async () => {
    userCreate
      .mockResolvedValueOnce({
        id: 'usr_one',
        nickname: null,
        avatarAssetId: null,
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      })
      .mockResolvedValueOnce({
        id: 'usr_two',
        nickname: null,
        avatarAssetId: null,
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      });
    identityCreate.mockResolvedValue({ id: 'idn' });

    await service.register({ username: 'FloraOne', password: PASSWORD });
    await service.register({ username: 'FloraTwo', password: 'Other@2026' });

    expect(readProviderSubject(identityCreate.mock.calls[0]?.[0])).toBe('FloraOne');
    expect(readProviderSubject(identityCreate.mock.calls[1]?.[0])).toBe('FloraTwo');
  });

  it('maps only the password username unique conflict to 409', async () => {
    userCreate.mockResolvedValue({
      id: 'usr_new',
      nickname: null,
      avatarAssetId: null,
      status: UserStatus.ACTIVE,
      createdAt: CREATED_AT,
    });
    identityCreate.mockRejectedValue(usernameConflict());

    await expect(
      service.register({ username: 'Flora', password: PASSWORD }),
    ).rejects.toBeInstanceOf(ConflictException);

    identityCreate.mockRejectedValue(primaryKeyConflict());
    userCreate.mockRejectedValue(primaryKeyConflict());
    await expect(
      service.register({ username: 'Flora', password: PASSWORD }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);

    userCreate.mockResolvedValue({
      id: 'usr_new',
      nickname: null,
      avatarAssetId: null,
      status: UserStatus.ACTIVE,
      createdAt: CREATED_AT,
    });
    identityCreate.mockRejectedValue(usernameIndexOnOtherModel());
    await expect(
      service.register({ username: 'Flora', password: PASSWORD }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it('rejects the transaction callback when identity creation fails', async () => {
    userCreate.mockResolvedValue({
      id: 'usr_new',
      nickname: null,
      avatarAssetId: null,
      status: UserStatus.ACTIVE,
      createdAt: CREATED_AT,
    });
    identityCreate.mockRejectedValue(new Error('identity failed'));

    await expect(
      service.register({ username: 'Flora', password: PASSWORD }),
    ).rejects.toThrow('identity failed');
    expect(userCreate).toHaveBeenCalled();
    expect(identityCreate).toHaveBeenCalled();
    expect(events[0]).toBe(`hash:${PASSWORD}`);
    expect(events[1]).toBe('transaction');
  });
});

describe('AuthService.login', () => {
  const verify = vi.fn();
  const findUnique = vi.fn();
  const issue = vi.fn();
  const service = new AuthService(
    { authIdentity: { findUnique } } as unknown as PrismaService,
    { verify } as unknown as PasswordHasherService,
    { issue } as unknown as AccessTokenService,
  );

  beforeEach(() => {
    verify.mockReset();
    findUnique.mockReset();
    issue.mockReset();
    verify.mockResolvedValue(true);
    issue.mockImplementation((userId: string) => ({
      accessToken: `token-${userId}`,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    }));
  });

  it('logs in an active user and keeps the normalized username', async () => {
    findUnique.mockResolvedValue(createIdentity('usr_cafe', UserStatus.ACTIVE));

    const result = await service.login({
      username: '  Cafe\u0301xy  ',
      password: PASSWORD,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerSubject: {
          provider: AuthProvider.PASSWORD,
          providerSubject: 'Caféxy',
        },
      },
      include: { user: true },
    });
    expect(verify).toHaveBeenCalledWith(PASSWORD_HASH, PASSWORD);
    expect(issue).toHaveBeenCalledWith('usr_cafe');
    expect(result).toEqual({
      accessToken: 'token-usr_cafe',
      tokenType: 'Bearer',
      expiresIn: 900,
      username: 'Caféxy',
      user: {
        id: 'usr_cafe',
        nickname: '星辰',
        avatarAssetId: null,
        status: UserStatus.ACTIVE,
        createdAt: CREATED_AT,
      },
    });
    expect(JSON.stringify(result)).not.toContain(PASSWORD);
    expect(JSON.stringify(result)).not.toContain(PASSWORD_HASH);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('logs in a Chinese username', async () => {
    findUnique.mockResolvedValue(createIdentity('usr_cn', UserStatus.ACTIVE));

    const result = await service.login({
      username: '摘星重现',
      password: PASSWORD,
    });

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_providerSubject: {
            provider: AuthProvider.PASSWORD,
            providerSubject: '摘星重现',
          },
        },
      }),
    );
    expect(result.user.id).toBe('usr_cn');
    expect(result.username).toBe('摘星重现');
  });

  it('keeps surrounding spaces in the password', async () => {
    findUnique.mockResolvedValue(createIdentity('usr_space', UserStatus.ACTIVE));

    await service.login({
      username: 'Flora',
      password: ' secret ',
    });

    expect(verify).toHaveBeenCalledWith(PASSWORD_HASH, ' secret ');
  });

  it('verifies the dummy hash when the identity does not exist', async () => {
    findUnique.mockResolvedValue(null);

    const error = await captureLoginError(
      service.login({ username: 'Flora', password: PASSWORD }),
    );

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(readExceptionCode(error)).toBe('INVALID_CREDENTIALS');
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith(DUMMY_ARGON2ID_PASSWORD_HASH, PASSWORD);
    expect(issue).not.toHaveBeenCalled();
  });

  it('verifies the dummy hash when the password hash is empty', async () => {
    findUnique.mockResolvedValue(
      createIdentity('usr_empty', UserStatus.ACTIVE, null),
    );

    const error = await captureLoginError(
      service.login({ username: 'Flora', password: PASSWORD }),
    );

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(readExceptionCode(error)).toBe('INVALID_CREDENTIALS');
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith(DUMMY_ARGON2ID_PASSWORD_HASH, PASSWORD);
    expect(issue).not.toHaveBeenCalled();
  });

  it('rejects a wrong password without issuing a token', async () => {
    findUnique.mockResolvedValue(createIdentity('usr_wrong', UserStatus.ACTIVE));
    verify.mockResolvedValue(false);

    const error = await captureLoginError(
      service.login({ username: 'Flora', password: PASSWORD }),
    );

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(readExceptionCode(error)).toBe('INVALID_CREDENTIALS');
    expect(verify).toHaveBeenCalledWith(PASSWORD_HASH, PASSWORD);
    expect(issue).not.toHaveBeenCalled();
  });

  it('rejects a stored hash that is not Argon2id', async () => {
    findUnique.mockResolvedValue(
      createIdentity('usr_bcrypt', UserStatus.ACTIVE, '$2b$12$notargon'),
    );
    verify.mockResolvedValue(false);

    const error = await captureLoginError(
      service.login({ username: 'Flora', password: PASSWORD }),
    );

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(readExceptionCode(error)).toBe('INVALID_CREDENTIALS');
    expect(verify).toHaveBeenCalledWith('$2b$12$notargon', PASSWORD);
    expect(issue).not.toHaveBeenCalled();
  });

  it.each([
    UserStatus.DISABLED,
    UserStatus.PENDING_DELETION,
    UserStatus.DELETED,
  ])('rejects a %s user after the password matches', async (status) => {
    findUnique.mockResolvedValue(createIdentity('usr_locked', status));

    const error = await captureLoginError(
      service.login({ username: 'Flora', password: PASSWORD }),
    );

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(readExceptionCode(error)).toBe('USER_NOT_ACTIVE');
    expect(verify).toHaveBeenCalledWith(PASSWORD_HASH, PASSWORD);
    expect(issue).not.toHaveBeenCalled();
  });

  it('keeps an inactive account indistinguishable when the password is wrong', async () => {
    findUnique.mockResolvedValue(
      createIdentity('usr_locked', UserStatus.DISABLED),
    );
    verify.mockResolvedValue(false);

    const error = await captureLoginError(
      service.login({ username: 'Flora', password: PASSWORD }),
    );

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(readExceptionCode(error)).toBe('INVALID_CREDENTIALS');
    expect(issue).not.toHaveBeenCalled();
  });

  it('puts a different sub on tokens for different users', async () => {
    findUnique
      .mockResolvedValueOnce(createIdentity('usr_one', UserStatus.ACTIVE))
      .mockResolvedValueOnce(createIdentity('usr_two', UserStatus.ACTIVE));

    const first = await service.login({ username: 'FloraOne', password: PASSWORD });
    const second = await service.login({
      username: 'FloraTwo',
      password: 'Other@2026',
    });

    expect(issue).toHaveBeenNthCalledWith(1, 'usr_one');
    expect(issue).toHaveBeenNthCalledWith(2, 'usr_two');
    expect(first.accessToken).toBe('token-usr_one');
    expect(second.accessToken).toBe('token-usr_two');
    expect(first.user.id).not.toBe(second.user.id);
  });
});

function createIdentity(
  userId: string,
  status: UserStatus,
  passwordHash: string | null = PASSWORD_HASH,
): {
  passwordHash: string | null;
  user: {
    id: string;
    nickname: string;
    avatarAssetId: null;
    status: UserStatus;
    createdAt: Date;
  };
} {
  return {
    passwordHash,
    user: {
      id: userId,
      nickname: '星辰',
      avatarAssetId: null,
      status,
      createdAt: CREATED_AT,
    },
  };
}

async function captureLoginError(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('Expected login to fail');
    },
    (caught: unknown) => caught,
  );
}

function readExceptionCode(error: unknown): string {
  if (!(error instanceof UnauthorizedException) && !(error instanceof ForbiddenException)) {
    throw new Error('Expected an HTTP exception');
  }
  const response: unknown = error.getResponse();
  if (!isRecord(response) || typeof response.code !== 'string') {
    throw new Error('Expected an exception code');
  }
  return response.code;
}

function readProviderSubject(call: unknown): string {
  if (!isRecord(call) || !isRecord(call.data) || typeof call.data.providerSubject !== 'string') {
    throw new Error('Expected identity create arguments');
  }
  return call.data.providerSubject;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
