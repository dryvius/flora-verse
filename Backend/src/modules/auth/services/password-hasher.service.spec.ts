import { describe, expect, it } from 'vitest';
import { ARGON2ID_OPTIONS, PasswordHasherService } from './password-hasher.service.js';

const PARAMETER_SEGMENT = `m=${ARGON2ID_OPTIONS.memoryCost},t=${ARGON2ID_OPTIONS.timeCost},p=${ARGON2ID_OPTIONS.parallelism}`;

describe('PasswordHasherService', () => {
  const service = new PasswordHasherService();

  it('creates a different Argon2id hash for the same password', async () => {
    const password = 'same-password';

    const first = await service.hash(password);
    const second = await service.hash(password);

    expect(first).not.toBe(second);
    expect(first.startsWith('$argon2id$')).toBe(true);
    expect(second.startsWith('$argon2id$')).toBe(true);
    expect(first).toContain(PARAMETER_SEGMENT);
    expect(first).not.toContain(password);
    expect(second).not.toContain(password);
  });

  it('accepts the original password and rejects a different one', async () => {
    const encoded = await service.hash('alpha-password');

    await expect(service.verify(encoded, 'alpha-password')).resolves.toBe(true);
    await expect(service.verify(encoded, 'beta-password')).resolves.toBe(false);
  });

  it('treats surrounding spaces as part of the password', async () => {
    const password = ' secret ';
    const encoded = await service.hash(password);

    await expect(service.verify(encoded, password)).resolves.toBe(true);
    await expect(service.verify(encoded, password.trim())).resolves.toBe(false);
  });

  it('hashes and verifies a Chinese password', async () => {
    const password = '青苔密码';
    const encoded = await service.hash(password);

    await expect(service.verify(encoded, password)).resolves.toBe(true);
    await expect(service.verify(encoded, '苔痕密码')).resolves.toBe(false);
  });

  it('hashes and verifies a password containing symbols', async () => {
    const password = 'p@ss/w0rd!#$';
    const encoded = await service.hash(password);

    await expect(service.verify(encoded, password)).resolves.toBe(true);
    await expect(service.verify(encoded, 'p@ss/w0rd!#')).resolves.toBe(false);
  });

  it('returns false for malformed hashes without throwing', async () => {
    await expect(service.verify('not-a-hash', 'alpha-password')).resolves.toBe(
      false,
    );
    await expect(service.verify('$argon2id$', 'alpha-password')).resolves.toBe(
      false,
    );
    await expect(
      service.verify('$argon2i$v=19$m=8,t=1,p=1$aa$bb', 'alpha-password'),
    ).resolves.toBe(false);
  });
});
