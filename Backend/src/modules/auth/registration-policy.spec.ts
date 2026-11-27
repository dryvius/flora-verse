import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertPassword,
  assertUsername,
  normalizeUsername,
  resolveNickname,
  unicodeLength,
} from './registration-policy.js';

function expectInvalidUsername(input: string): void {
  expect(() => {
    assertUsername(normalizeUsername(input));
  }).toThrow(BadRequestException);
}

function expectValidUsername(input: string, normalized: string): void {
  const username = normalizeUsername(input);
  expect(username).toBe(normalized);
  expect(() => {
    assertUsername(username);
  }).not.toThrow();
}

describe('username policy', () => {
  it('accepts Chinese, English, digits, and underscores', () => {
    expectValidUsername('摘星重现', '摘星重现');
    expectValidUsername('Flora', 'Flora');
    expectValidUsername('flora_01', 'flora_01');
  });

  it('rejects three code points and accepts four and twenty', () => {
    expectInvalidUsername('植物园');
    expectValidUsername('植物园门', '植物园门');
    expectValidUsername('a'.repeat(20), 'a'.repeat(20));
    expectInvalidUsername('a'.repeat(21));
    expect(unicodeLength('🌿'.repeat(4))).toBe(4);
  });

  it('rejects a leading digit, underscore, emoji, space, or symbol', () => {
    expectInvalidUsername('1flora');
    expectInvalidUsername('_flora');
    expectInvalidUsername('flora🌿');
    expectInvalidUsername('flo ra');
    expectInvalidUsername('flo-ra');
  });

  it('trims surrounding spaces and applies NFC', () => {
    expectValidUsername('  Flora  ', 'Flora');
    const decomposed = 'Cafe\u0301xy';
    expect(decomposed.normalize('NFC')).toBe('Caféxy');
    expectValidUsername(`  ${decomposed}  `, 'Caféxy');
  });

  it('keeps a combining mark that NFC cannot compose', () => {
    const username = 'qqq\u0300';
    expect(username.normalize('NFC')).toBe(username);
    expect(unicodeLength(username)).toBe(4);
    expectValidUsername(username, username);
  });
});

describe('password policy', () => {
  it('enforces code-point bounds without trimming or changing case', () => {
    expect(() => {
      assertPassword('abcdefg');
    }).toThrow(BadRequestException);
    expect(() => {
      assertPassword('abcdefgh');
    }).not.toThrow();
    expect(() => {
      assertPassword('a'.repeat(128));
    }).not.toThrow();
    expect(() => {
      assertPassword('a'.repeat(129));
    }).toThrow(BadRequestException);

    const spaced = '  Flora@  ';
    expect(() => {
      assertPassword(spaced);
    }).not.toThrow();
    expect(spaced).toBe('  Flora@  ');
    expect(() => {
      assertPassword('Flora@2026');
    }).not.toThrow();
    expect(() => {
      assertPassword('flora@2026');
    }).not.toThrow();
    expect('Flora@2026').not.toBe('flora@2026');
  });

  it('accepts Chinese and symbols', () => {
    expect(() => {
      assertPassword('青苔密码测试用之');
    }).not.toThrow();
    expect(() => {
      assertPassword('p@ss w0rd!');
    }).not.toThrow();
  });

  it('rejects a password whose UTF-8 size exceeds 512 bytes', () => {
    const password = '\u{1F331}'.repeat(129);
    expect(unicodeLength(password)).toBe(129);
    expect(Buffer.byteLength(password, 'utf8')).toBeGreaterThan(512);
    expect(() => {
      assertPassword(password);
    }).toThrow(BadRequestException);

    const boundary = '\u{1F331}'.repeat(128);
    expect(Buffer.byteLength(boundary, 'utf8')).toBe(512);
    expect(() => {
      assertPassword(boundary);
    }).not.toThrow();
  });
});

describe('nickname policy', () => {
  it('uses null when nickname is omitted or null', () => {
    expect(resolveNickname(undefined)).toBeNull();
    expect(resolveNickname(null)).toBeNull();
  });

  it('accepts 64 code points and rejects 65', () => {
    expect(resolveNickname('星辰')).toBe('星辰');
    expect(resolveNickname('苔'.repeat(64))).toBe('苔'.repeat(64));
    expect(() => {
      resolveNickname('苔'.repeat(65));
    }).toThrow(BadRequestException);
  });

  it('counts supplementary-plane characters as one code point', () => {
    const nickname = '\u{1F331}'.repeat(64);
    expect(nickname.length).toBe(128);
    expect(unicodeLength(nickname)).toBe(64);
    expect(resolveNickname(nickname)).toBe(nickname);
  });
});
