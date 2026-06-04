import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFunctionQueue from './useFunctionQueue';

describe('useFunctionQueue', () => {
  it('executes an enqueued function', async () => {
    const { result } = renderHook(() => useFunctionQueue());
    const fn = vi.fn();

    await act(async () => {
      result.current(fn);
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('executes multiple functions in the order they were enqueued', async () => {
    const { result } = renderHook(() => useFunctionQueue());
    const order: number[] = [];

    await act(async () => {
      result.current(() => order.push(1));
      result.current(() => order.push(2));
      result.current(() => order.push(3));
    });

    expect(order).toEqual([1, 2, 3]);
  });

  it('executes functions from separate enqueue calls in order', async () => {
    const { result } = renderHook(() => useFunctionQueue());
    const order: number[] = [];

    await act(async () => { result.current(() => order.push(1)); });
    await act(async () => { result.current(() => order.push(2)); });

    expect(order).toEqual([1, 2]);
  });
});
