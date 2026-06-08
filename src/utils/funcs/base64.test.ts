import { describe, it, expect } from 'vitest';
import { decodeBase64 } from './base64';

describe('decodeBase64', () => {
  it('decodes a standard base64 string', () => {
    expect(decodeBase64('SGVsbG8gV29ybGQ=')).toBe('Hello World');
  });

  it('replaces URL-safe - with + before decoding', () => {
    // "Hello+World" base64-encoded is "SGVsbG8rV29ybGQ=" but with URL-safe it uses '-'
    const urlSafe = btoa('Hello+World').replace(/\+/g, '-');
    expect(decodeBase64(urlSafe)).toBe('Hello+World');
  });

  it('replaces URL-safe _ with / before decoding', () => {
    const urlSafe = btoa('Hello/World').replace(/\//g, '_');
    expect(decodeBase64(urlSafe)).toBe('Hello/World');
  });

  it('throws on invalid base64 input', () => {
    expect(() => decodeBase64('!!!not-base64!!!')).toThrow('Failed to decode base64 string');
  });
});
