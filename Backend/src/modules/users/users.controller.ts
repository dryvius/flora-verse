import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { CurrentUser as CurrentUserIdentity } from '../../common/auth/current-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UserMeResponseDto } from './dto/user-me-response.dto.js';
import { UsersService } from './users.service.js';
import type { UserProfile } from './users.types.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '获取当前登录用户资料' })
  @ApiOkResponse({ type: UserMeResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'UNAUTHORIZED：缺少 Authorization，或 sub 对应用户不存在。INVALID_TOKEN：Token 格式、签名或 sub 无效。TOKEN_EXPIRED：Token 已过期。USER_NOT_ACTIVE：用户状态不是 ACTIVE。',
    type: ApiErrorResponseDto,
  })
  me(@CurrentUser() currentUser: CurrentUserIdentity): Promise<UserProfile> {
    return this.usersService.requireActiveById(currentUser.id);
  }
}
