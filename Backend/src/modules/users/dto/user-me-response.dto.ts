import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../generated/prisma/enums.js';

export class UserMeDataDto {
  @ApiProperty({ example: 'usr_xxx' })
  id!: string;

  @ApiProperty({ type: String, nullable: true, example: '星辰' })
  nickname!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  avatarAssetId!: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiProperty({ example: '2026-11-26T06:00:00.000Z' })
  createdAt!: string;
}

export class UserMeResponseDto {
  @ApiProperty({ example: 'OK' })
  code!: 'OK';

  @ApiProperty({ example: 'success' })
  message!: string;

  @ApiProperty({ type: UserMeDataDto })
  data!: UserMeDataDto;

  @ApiProperty({ example: 'req_018f2c5e-7b1a-7c2d-8e3f-123456789abc' })
  requestId!: string;
}
