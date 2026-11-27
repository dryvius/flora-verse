import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { toUserProfile, type UserProfile } from './users.types.js';

const NICKNAME_MAX_LENGTH = 64;

const USER_PROFILE_SELECT = {
  id: true,
  nickname: true,
  avatarAssetId: true,
  status: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_SELECT,
    });
    if (user === null) {
      return null;
    }
    return toUserProfile(user);
  }

  async requireActiveById(userId: string): Promise<UserProfile> {
    const profile = await this.findById(userId);
    if (profile === null) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      });
    }
    if (profile.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'USER_NOT_ACTIVE',
        message: 'User is not active',
      });
    }
    return profile;
  }

  async updateNickname(userId: string, nickname: string): Promise<UserProfile> {
    this.assertNickname(nickname);

    const updated = await this.prisma.user.updateMany({
      where: {
        id: userId,
        status: UserStatus.ACTIVE,
      },
      data: { nickname },
    });
    if (updated.count === 1) {
      const profile = await this.findById(userId);
      if (profile === null) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }
      return profile;
    }

    const current = await this.findById(userId);
    if (current === null) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    if (current.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'USER_PROFILE_LOCKED',
        message: 'User profile cannot be updated',
      });
    }
    throw new ForbiddenException({
      code: 'USER_PROFILE_LOCKED',
      message: 'User profile cannot be updated',
    });
  }

  private assertNickname(nickname: string): void {
    if ([...nickname].length > NICKNAME_MAX_LENGTH) {
      throw new BadRequestException({
        code: 'INVALID_NICKNAME',
        message: 'Nickname exceeds the maximum length',
      });
    }
  }
}
