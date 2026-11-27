import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthProvider, UserStatus } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { toUserProfile } from '../users/users.types.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import {
  assertPassword,
  assertUsername,
  normalizeUsername,
  resolveNickname,
} from './registration-policy.js';
import { PasswordHasherService } from './services/password-hasher.service.js';
import { AccessTokenService } from './services/access-token.service.js';
import type { LoginResult, RegisterResult } from './auth.types.js';

/** 预计算的 Argon2id 哈希，只用于补齐身份缺失或空哈希路径的校验耗时。 */
export const DUMMY_ARGON2ID_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$posGTM8D+KnU1B5aQcj0dQ$5ylGudNfDEEgK81hi3bBCTDbbIH4IiGnIqOD6dUK4Lk';

const INVALID_CREDENTIALS = {
  code: 'INVALID_CREDENTIALS',
  message: 'Invalid credentials',
} as const;

const USER_NOT_ACTIVE = {
  code: 'USER_NOT_ACTIVE',
  message: 'User is not active',
} as const;

const PASSWORD_USERNAME_UNIQUE_INDEX =
  'auth_identities_provider_providerSubject_key';

const USER_PROFILE_SELECT = {
  id: true,
  nickname: true,
  avatarAssetId: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly accessToken: AccessTokenService,
  ) {}

  async register(input: RegisterDto): Promise<RegisterResult> {
    const username = normalizeUsername(input.username);
    assertUsername(username);
    assertPassword(input.password);
    const nickname = resolveNickname(input.nickname);
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            status: UserStatus.ACTIVE,
            nickname,
          },
          select: USER_PROFILE_SELECT,
        });
        await tx.authIdentity.create({
          data: {
            userId: user.id,
            provider: AuthProvider.PASSWORD,
            providerSubject: username,
            passwordHash,
            unionId: null,
          },
        });
        return {
          user: toUserProfile(user),
          username,
        };
      });
    } catch (error: unknown) {
      if (isPasswordUsernameConflict(error)) {
        throw new ConflictException({
          code: 'USERNAME_ALREADY_EXISTS',
          message: '用户名已存在',
        });
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<LoginResult> {
    const username = normalizeUsername(input.username);
    assertUsername(username);
    assertPassword(input.password);

    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: AuthProvider.PASSWORD,
          providerSubject: username,
        },
      },
      include: {
        user: true,
      },
    });
    if (
      identity === null ||
      identity.passwordHash === null ||
      identity.passwordHash.length === 0
    ) {
      await this.passwordHasher.verify(
        DUMMY_ARGON2ID_PASSWORD_HASH,
        input.password,
      );
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.passwordHasher.verify(
      identity.passwordHash,
      input.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (identity.user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(USER_NOT_ACTIVE);
    }

    const issued = this.accessToken.issue(identity.user.id);
    return {
      accessToken: issued.accessToken,
      tokenType: 'Bearer',
      expiresIn: issued.expiresIn,
      user: toUserProfile(identity.user),
      username,
    };
  }
}

export function isPasswordUsernameConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002' ||
    error.meta?.modelName !== 'AuthIdentity'
  ) {
    return false;
  }
  return readConstraintIndex(error.meta) === PASSWORD_USERNAME_UNIQUE_INDEX;
}

function readConstraintIndex(meta: unknown): string | undefined {
  if (!isRecord(meta)) {
    return undefined;
  }
  const driverAdapterError = meta.driverAdapterError;
  if (!isRecord(driverAdapterError)) {
    return undefined;
  }
  const cause = driverAdapterError.cause;
  if (!isRecord(cause)) {
    return undefined;
  }
  const constraint = cause.constraint;
  if (!isRecord(constraint) || typeof constraint.index !== 'string') {
    return undefined;
  }
  return constraint.index;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
