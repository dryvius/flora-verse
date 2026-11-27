import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/dto/api-error-response.dto.js';
import { AuthService } from './auth.service.js';
import type { LoginResult, RegisterResult } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '使用用户名和密码注册，不签发登录凭证' })
  @ApiBody({ type: RegisterDto })
  register(@Body() input: RegisterDto): Promise<RegisterResult> {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '使用用户名和密码登录，签发 access token',
    description:
      '成功时 data.accessToken 作为 Authorization: Bearer 使用，对应 Swagger security scheme access-token。有效期 900 秒，不签发 refresh token。',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '登录成功。data.accessToken 是 access-token Bearer scheme 对应的 JWT，data.expiresIn 为 900。',
    schema: {
      example: {
        code: 'OK',
        message: 'success',
        data: {
          accessToken: '<jwt>',
          tokenType: 'Bearer',
          expiresIn: 900,
          username: '摘星重现',
          user: {
            id: 'usr_xxx',
            nickname: '星辰',
            avatarAssetId: null,
            status: 'ACTIVE',
            createdAt: '2026-11-26T06:00:00.000Z',
          },
        },
        requestId: 'req_xxx',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'INVALID_USERNAME、INVALID_PASSWORD 或 VALIDATION_ERROR',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'INVALID_CREDENTIALS',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'USER_NOT_ACTIVE',
    type: ApiErrorResponseDto,
  })
  login(@Body() input: LoginDto): Promise<LoginResult> {
    return this.authService.login(input);
  }
}
