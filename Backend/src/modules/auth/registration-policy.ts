import { BadRequestException } from '@nestjs/common';

const USERNAME_PATTERN = /^\p{L}[\p{L}\p{M}\p{N}_]*$/u;
const USERNAME_MIN_CODE_POINTS = 4;
const USERNAME_MAX_CODE_POINTS = 20;
const PASSWORD_MIN_CODE_POINTS = 8;
const PASSWORD_MAX_CODE_POINTS = 128;
const PASSWORD_MAX_UTF8_BYTES = 512;
const NICKNAME_MAX_CODE_POINTS = 64;

export function unicodeLength(value: string): number {
  return [...value].length;
}

export function normalizeUsername(username: string): string {
  return username.trim().normalize('NFC');
}

export function assertUsername(username: string): void {
  const length = unicodeLength(username);
  if (
    length < USERNAME_MIN_CODE_POINTS ||
    length > USERNAME_MAX_CODE_POINTS ||
    !USERNAME_PATTERN.test(username)
  ) {
    throw new BadRequestException({
      code: 'INVALID_USERNAME',
      message: 'Username is invalid',
    });
  }
}

export function assertPassword(password: string): void {
  const length = unicodeLength(password);
  const utf8Bytes = Buffer.byteLength(password, 'utf8');
  if (
    length < PASSWORD_MIN_CODE_POINTS ||
    length > PASSWORD_MAX_CODE_POINTS ||
    utf8Bytes > PASSWORD_MAX_UTF8_BYTES
  ) {
    throw new BadRequestException({
      code: 'INVALID_PASSWORD',
      message: 'Password is invalid',
    });
  }
}

export function resolveNickname(nickname: string | null | undefined): string | null {
  if (nickname === undefined || nickname === null) {
    return null;
  }
  if (unicodeLength(nickname) > NICKNAME_MAX_CODE_POINTS) {
    throw new BadRequestException({
      code: 'INVALID_NICKNAME',
      message: 'Nickname exceeds the maximum length',
    });
  }
  return nickname;
}
