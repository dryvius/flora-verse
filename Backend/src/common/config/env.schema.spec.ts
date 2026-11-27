import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema.js';

const validEnv = {
  DATABASE_URL: 'mysql://app:app_password@localhost:3306/floraverse',
  JWT_ACCESS_SECRET: 'local-dev-access-secret-change-before-production',
  JWT_REFRESH_SECRET: 'local-dev-refresh-secret-change-before-production',
};

describe('validateEnv', () => {
  it('accepts the local development contract', () => {
    const config = validateEnv(validEnv);

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.STORAGE_PROVIDER).toBe('local');
    expect(config.SWAGGER_ENABLED).toBe(false);
    expect(config.PLANT_RECOGNITION_PROVIDER).toBe('mock');
  });

  it('rejects a non-mysql database url without echoing the value', () => {
    let thrown: unknown;
    try {
      validateEnv({
        ...validEnv,
        DATABASE_URL: 'postgres://user:super-secret@localhost:5432/floraverse',
      });
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    if (!(thrown instanceof Error)) {
      return;
    }
    expect(thrown.message).toContain('DATABASE_URL');
    expect(thrown.message).not.toContain('super-secret');
  });

  it('rejects placeholder jwt secrets in production', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        NODE_ENV: 'production',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });
});
