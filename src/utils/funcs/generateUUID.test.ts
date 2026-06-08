import { describe, it, expect } from 'vitest';
import { generateUUID } from './generateUUID';

describe('generateUUID', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateUUID()).toBe('string');
    expect(generateUUID().length).toBeGreaterThan(0);
  });

  it('returns a different value on each call', () => {
    const ids = new Set(Array.from({ length: 20 }, generateUUID));
    expect(ids.size).toBe(20);
  });
});
