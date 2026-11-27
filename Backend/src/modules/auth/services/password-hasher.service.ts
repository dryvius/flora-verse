import { Injectable } from '@nestjs/common';
import {
  argon2id,
  hash as argon2Hash,
  verify as argon2Verify,
  type HashOptions,
} from 'argon2';

const ARGON2ID_PREFIX = '$argon2id$';

export const ARGON2ID_OPTIONS = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const satisfies HashOptions;

@Injectable()
export class PasswordHasherService {
  async hash(password: string): Promise<string> {
    return argon2Hash(password, ARGON2ID_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    if (!passwordHash.startsWith(ARGON2ID_PREFIX)) {
      return false;
    }

    try {
      return await argon2Verify(passwordHash, password);
    } catch {
      return false;
    }
  }
}
