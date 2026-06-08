import { describe, it, expect } from 'vitest';
import { resolveExactOrigin, appendParentOriginToIframeSrc } from './bridgeOrigin';

describe('resolveExactOrigin', () => {
  it('returns the origin of a full URL', () => {
    expect(resolveExactOrigin('https://example.com/path?q=1')).toBe('https://example.com');
  });

  it('resolves a relative URL against a base', () => {
    expect(resolveExactOrigin('/foo', 'https://example.com')).toBe('https://example.com');
  });

  it('returns null for null input', () => {
    expect(resolveExactOrigin(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(resolveExactOrigin(undefined)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(resolveExactOrigin('')).toBeNull();
  });

  it('returns null for an invalid URL with no base', () => {
    expect(resolveExactOrigin('not-a-url')).toBeNull();
  });
});

describe('appendParentOriginToIframeSrc', () => {
  it('appends parentOrigin param derived from parentHref', () => {
    const result = appendParentOriginToIframeSrc(
      'https://drops.example.com/cardlink',
      'https://merchant.example.com/checkout'
    );
    expect(result).toBe(
      'https://drops.example.com/cardlink?parentOrigin=https%3A%2F%2Fmerchant.example.com'
    );
  });

  it('returns src unchanged when parentHref is undefined', () => {
    const src = 'https://drops.example.com/cardlink';
    expect(appendParentOriginToIframeSrc(src)).toBe(src);
  });

  it('returns src unchanged when parentHref origin cannot be resolved', () => {
    const src = 'https://drops.example.com/cardlink';
    expect(appendParentOriginToIframeSrc(src, 'not-a-url')).toBe(src);
  });

  it('returns src unchanged when src itself is invalid', () => {
    expect(appendParentOriginToIframeSrc('not-a-url')).toBe('not-a-url');
  });
});
