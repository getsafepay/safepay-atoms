import { describe, it, expect } from 'vitest';
import { resolveBaseUrl } from './resolveBaseUrl';
import { Environment, toEnvironment } from '../../types/environment';

describe('resolveBaseUrl', () => {
  it('returns sandbox URL for sandbox environment', () => {
    expect(resolveBaseUrl(Environment.Sandbox)).toBe('https://sandbox.api.getsafepay.com/drops');
  });

  it('returns dev URL for development environment', () => {
    expect(resolveBaseUrl(Environment.Development)).toBe('https://dev.api.getsafepay.com/drops');
  });

  it('returns localhost URL for local environment', () => {
    expect(resolveBaseUrl(Environment.Local)).toBe('http://127.0.0.1:3000');
  });

  it('returns production URL for production environment', () => {
    expect(resolveBaseUrl(Environment.Production)).toBe('https://getsafepay.com/drops');
  });
});

describe('toEnvironment', () => {
  it('maps string values case-insensitively', () => {
    expect(toEnvironment('sandbox')).toBe(Environment.Sandbox);
    expect(toEnvironment('DEVELOPMENT')).toBe(Environment.Development);
    expect(toEnvironment('  Production  ')).toBe(Environment.Production);
  });

  it('returns production for null or undefined', () => {
    expect(toEnvironment(null)).toBe(Environment.Production);
    expect(toEnvironment(undefined)).toBe(Environment.Production);
  });

  it('passes through an Environment enum value unchanged', () => {
    expect(toEnvironment(Environment.Local)).toBe(Environment.Local);
  });

  it('throws for an unrecognised string', () => {
    expect(() => toEnvironment('staging')).toThrow('[Safepay Atoms] Invalid environment "staging"');
  });
});
