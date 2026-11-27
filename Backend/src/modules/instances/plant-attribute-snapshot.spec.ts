import { describe, expect, it } from 'vitest';
import {
  assertPlantAttributeSnapshot,
  createEmptyPlantAttributeSnapshot,
} from './plant-attribute-snapshot.js';

describe('plant attribute snapshot', () => {
  it('creates an empty snapshot without inventing attribute names', () => {
    expect(createEmptyPlantAttributeSnapshot()).toEqual({
      version: '0',
      attributes: {},
    });
  });

  it('accepts an empty attribute map', () => {
    expect(assertPlantAttributeSnapshot({ version: '0', attributes: {} })).toEqual({
      version: '0',
      attributes: {},
    });
  });

  it('rejects attribute names before they are confirmed', () => {
    expect(() =>
      assertPlantAttributeSnapshot({
        version: '0',
        attributes: { attack: 1 },
      }),
    ).toThrow(/not confirmed/);
  });
});
