import { describe, it, expect, vi } from 'vitest';
import { defineReactiveProperties } from './defineReactiveProperties';

let counter = 0;
function makeElement(props: string[], renderProperty?: string) {
  class El extends HTMLElement {}
  const tag = `test-el-${counter++}`;
  customElements.define(tag, El);
  defineReactiveProperties(El, props, renderProperty);
  return document.createElement(tag) as El;
}

describe('defineReactiveProperties', () => {
  it('defines getter and setter for each property', () => {
    const el = makeElement(['authToken']);
    el['authToken'] = 'abc';
    expect(el['authToken']).toBe('abc');
  });

  it('calls renderProperty.render with the updated prop when set', () => {
    const el = makeElement(['tracker']);
    const render = vi.fn();
    el['_atom'] = { render };

    el['tracker'] = 'trk_123';
    expect(render).toHaveBeenCalledWith({ tracker: 'trk_123' });
  });

  it('does not throw when renderProperty is absent', () => {
    const el = makeElement(['authToken']);
    expect(() => { el['authToken'] = 'value'; }).not.toThrow();
  });

  it('uses a custom renderProperty name when provided', () => {
    const el = makeElement(['environment'], '_customAtom');
    const render = vi.fn();
    el['_customAtom'] = { render };

    el['environment'] = 'sandbox';
    expect(render).toHaveBeenCalledWith({ environment: 'sandbox' });
  });

  it('defines multiple properties independently', () => {
    const el = makeElement(['foo', 'bar']);
    el['foo'] = 1;
    el['bar'] = 2;
    expect(el['foo']).toBe(1);
    expect(el['bar']).toBe(2);
  });
});
