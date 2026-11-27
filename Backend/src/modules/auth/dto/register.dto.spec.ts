import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { RegisterDto } from './register.dto.js';

async function validateInput(input: object): Promise<string[]> {
  const dto = plainToInstance(RegisterDto, input);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error) => error.property);
}

describe('RegisterDto', () => {
  it('accepts a username, password, and optional nickname', async () => {
    await expect(
      validateInput({
        username: '摘星重现',
        password: 'Flora@2026',
        nickname: '星辰',
      }),
    ).resolves.toEqual([]);
    await expect(
      validateInput({
        username: '摘星重现',
        password: 'Flora@2026',
      }),
    ).resolves.toEqual([]);
    await expect(
      validateInput({
        username: '摘星重现',
        password: 'Flora@2026',
        nickname: null,
      }),
    ).resolves.toEqual([]);
  });

  it('rejects a missing password and an unknown field', async () => {
    await expect(
      validateInput({
        username: '摘星重现',
      }),
    ).resolves.toContain('password');
    await expect(
      validateInput({
        username: '摘星重现',
        password: 'Flora@2026',
        extra: true,
      }),
    ).resolves.toContain('extra');
  });
});
