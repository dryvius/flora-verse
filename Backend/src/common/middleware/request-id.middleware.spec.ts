import { describe, expect, it } from 'vitest';
import { resolveRequestId } from './request-id.middleware.js';

describe('resolveRequestId', () => {
  it('keeps a safe client request id', () => {
    expect(resolveRequestId('req_client-01')).toBe('req_client-01');
  });

  it('replaces missing or unsafe request ids', () => {
    expect(resolveRequestId(undefined).startsWith('req_')).toBe(true);
    expect(resolveRequestId('bad id')).not.toBe('bad id');
    expect(resolveRequestId('../secret')).not.toContain('secret');
  });
});
