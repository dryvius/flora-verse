import { describe, expect, it } from 'vitest';
import { redactSecrets } from './redact-secrets.js';

describe('redactSecrets', () => {
  it('removes mysql credentials and bearer tokens', () => {
    const redacted = redactSecrets(
      'connect mysql://app:app_password@localhost:3306/floraverse Authorization: Bearer abc.def-ghi',
    );

    expect(redacted).not.toContain('app_password');
    expect(redacted).not.toContain('abc.def-ghi');
    expect(redacted).toContain('mysql://***');
    expect(redacted).toContain('Bearer ***');
  });
});
