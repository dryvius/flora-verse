import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { LoginDto } from './login.dto.js';

async function validateInput(input: object): Promise<string[]> {
  const dto = plainToInstance(LoginDto, input);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error) => error.property);
}

describe('LoginDto', () => {
  it('accepts a username and password', async () => {
    await expect(
      validateInput({
        username: '摘星重现',
        password: 'Flora@2026',
      }),
    ).resolves.toEqual([]);
  });

  it('rejects a missing username or password', async () => {
    await expect(validateInput({ password: 'Flora@2026' })).resolves.toContain(
      'username',
    );
    await expect(validateInput({ username: '摘星重现' })).resolves.toContain(
      'password',
    );
    await expect(validateInput({})).resolves.toEqual(
      expect.arrayContaining(['username', 'password']),
    );
  });

  it('rejects empty strings', async () => {
    await expect(
      validateInput({ username: '', password: 'Flora@2026' }),
    ).resolves.toContain('username');
    await expect(
      validateInput({ username: '摘星重现', password: '' }),
    ).resolves.toContain('password');
  });

  it('rejects non-string username and password values', async () => {
    await expect(
      validateInput({ username: 1, password: 'Flora@2026' }),
    ).resolves.toContain('username');
    await expect(
      validateInput({ username: '摘星重现', password: 1 }),
    ).resolves.toContain('password');
    await expect(
      validateInput({ username: null, password: 'Flora@2026' }),
    ).resolves.toContain('username');
  });

  it('rejects an unknown field', async () => {
    await expect(
      validateInput({
        username: '摘星重现',
        password: 'Flora@2026',
        extra: true,
      }),
    ).resolves.toContain('extra');
  });
});
