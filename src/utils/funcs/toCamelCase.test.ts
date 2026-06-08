import { describe, it, expect } from 'vitest';
import { toCamelCase } from './toCamelCase';

describe('toCamelCase', () => {
  it('converts kebab-case to camelCase', () => {
    expect(toCamelCase('auth-token')).toBe('authToken');
    expect(toCamelCase('on-payer-authentication-success')).toBe('onPayerAuthenticationSuccess');
  });

  it('leaves a single word unchanged', () => {
    expect(toCamelCase('tracker')).toBe('tracker');
  });

  it('leaves an already-camelCase string unchanged', () => {
    expect(toCamelCase('authToken')).toBe('authToken');
  });

  it('handles a leading hyphen', () => {
    expect(toCamelCase('-foo')).toBe('Foo');
  });
});
