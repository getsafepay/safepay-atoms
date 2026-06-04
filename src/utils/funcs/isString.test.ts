import { describe, it, expect } from 'vitest';
import { isString } from './isString';

describe('isString', () => {
  it('returns true for a string primitive', () => {
    expect(isString('hello')).toBe(true);
    expect(isString('')).toBe(true);
  });

  it('returns true for a String object', () => {
    // eslint-disable-next-line no-new-wrappers
    expect(isString(new String('hello') as any)).toBe(true);
  });

  it('returns false for non-strings', () => {
    expect(isString(42 as any)).toBe(false);
    expect(isString(null as any)).toBe(false);
    expect(isString([] as any)).toBe(false);
    expect(isString({} as any)).toBe(false);
  });
});
