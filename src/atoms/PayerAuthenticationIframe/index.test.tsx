import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { render, act, screen } from '@testing-library/react';
import { Environment } from '../../types/environment';
import PayerAuthentication, { DEFAULT_AUTHENTICATION_TIMEOUT_MS } from './index';

vi.mock('./iframe', () => ({ default: vi.fn() }));

import InframeComponent from './iframe';

let capturedOnInframeEvent: ((name: string, detail: any) => void) | undefined;

beforeEach(() => {
  capturedOnInframeEvent = undefined;
  vi.mocked(InframeComponent).mockImplementation(({ src, onInframeEvent }: any) => {
    capturedOnInframeEvent = onInframeEvent;
    return React.createElement('iframe', { 'data-testid': 'auth-iframe', src });
  });
});

const defaultProps = {
  environment: Environment.Sandbox,
  authToken: 'test-token',
  tracker: 'test-tracker',
  deviceDataCollectionJWT: 'ddc-jwt',
  deviceDataCollectionURL: 'https://example.com/ddc',
  imperativeRef: createRef<any>(),
};

describe('PayerAuthentication', () => {
  it('renders an iframe pointing at the sandbox authlink URL', () => {
    render(<PayerAuthentication {...defaultProps} />);
    const iframe = screen.getByTestId('auth-iframe');
    expect(iframe.getAttribute('src')).toContain('sandbox.api.getsafepay.com/drops/authlink');
  });

  it('calls onPayerAuthenticationFrictionless when enrollment is frictionless', () => {
    const onPayerAuthenticationFrictionless = vi.fn();
    render(<PayerAuthentication {...defaultProps} onPayerAuthenticationFrictionless={onPayerAuthenticationFrictionless} />);
    const detail = { tracker: 'test-tracker', request_id: 'req_1' };
    act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__frictionless', detail); });
    expect(onPayerAuthenticationFrictionless).toHaveBeenCalledWith(detail);
  });

  it('calls onPayerAuthenticationSuccess on 3DS challenge success', () => {
    const onPayerAuthenticationSuccess = vi.fn();
    render(<PayerAuthentication {...defaultProps} onPayerAuthenticationSuccess={onPayerAuthenticationSuccess} />);
    const detail = { tracker: 'test-tracker', payment_method: 'pm_123' };
    act(() => { capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__success', detail); });
    expect(onPayerAuthenticationSuccess).toHaveBeenCalledWith(detail);
  });

  it('calls onPayerAuthenticationFailure on 3DS challenge failure', () => {
    const onPayerAuthenticationFailure = vi.fn();
    render(<PayerAuthentication {...defaultProps} onPayerAuthenticationFailure={onPayerAuthenticationFailure} />);
    const detail = { tracker: 'test-tracker', error: 'failed' };
    act(() => { capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__failure', detail); });
    expect(onPayerAuthenticationFailure).toHaveBeenCalledWith(detail);
  });

  it('calls onPayerAuthenticationUnavailable when enrollment fails', () => {
    const onPayerAuthenticationUnavailable = vi.fn();
    render(<PayerAuthentication {...defaultProps} onPayerAuthenticationUnavailable={onPayerAuthenticationUnavailable} tracker="trk_x" />);
    act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', {}); });
    expect(onPayerAuthenticationUnavailable).toHaveBeenCalledWith({ tracker: 'trk_x' });
  });

  it('calls onPayerAuthenticationRequired when step-up is needed', () => {
    const onPayerAuthenticationRequired = vi.fn();
    render(<PayerAuthentication {...defaultProps} onPayerAuthenticationRequired={onPayerAuthenticationRequired} tracker="trk_y" />);
    act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__required', {}); });
    expect(onPayerAuthenticationRequired).toHaveBeenCalledWith({ tracker: 'trk_y' });
  });

  it('calls onSafepayError on safepay error events', () => {
    const onSafepayError = vi.fn();
    render(<PayerAuthentication {...defaultProps} onSafepayError={onSafepayError} />);
    const detail = { error: { message: 'Something went wrong', status: 500 } };
    act(() => { capturedOnInframeEvent?.('safepay-error', detail); });
    expect(onSafepayError).toHaveBeenCalledWith(detail);
  });

  describe('payment declined', () => {
    const declined = {
      errorMessage: 'Insufficient funds',
      responseCode: '51',
      merchantAdvice: { code: '01', codeRaw: 'M001' },
    };

    it('calls onPaymentDeclined with the tracker and decline details', () => {
      const onPaymentDeclined = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_d" onPaymentDeclined={onPaymentDeclined} />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined); });
      expect(onPaymentDeclined).toHaveBeenCalledWith({ tracker: 'trk_d', ...declined });
    });

    it('still calls onPayerAuthenticationUnavailable for a frictionless decline (backwards compatible)', () => {
      const calls: string[] = [];
      render(
        <PayerAuthentication
          {...defaultProps}
          onPaymentDeclined={() => calls.push('declined')}
          onPayerAuthenticationUnavailable={() => calls.push('unavailable')}
        />
      );
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined);
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', { errorMessage: 'Insufficient funds' });
      });
      expect(calls).toEqual(['declined', 'unavailable']);
    });
  });

  describe('authentication timeout', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    const requireChallenge = () =>
      act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__required', {}); });

    it('fires once after 10 minutes by default when a challenge gets no outcome', () => {
      const onPayerAuthenticationTimeout = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_t" onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />);
      requireChallenge();

      act(() => { vi.advanceTimersByTime(DEFAULT_AUTHENTICATION_TIMEOUT_MS - 1); });
      expect(onPayerAuthenticationTimeout).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(1); });
      expect(onPayerAuthenticationTimeout).toHaveBeenCalledTimes(1);
      expect(onPayerAuthenticationTimeout).toHaveBeenCalledWith({
        tracker: 'trk_t',
        timeoutMs: DEFAULT_AUTHENTICATION_TIMEOUT_MS,
      });

      act(() => { vi.advanceTimersByTime(DEFAULT_AUTHENTICATION_TIMEOUT_MS); });
      expect(onPayerAuthenticationTimeout).toHaveBeenCalledTimes(1);
    });

    it('honours a custom authenticationTimeoutMs', () => {
      const onPayerAuthenticationTimeout = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />);
      requireChallenge();
      act(() => { vi.advanceTimersByTime(5000); });
      expect(onPayerAuthenticationTimeout).toHaveBeenCalledWith({ tracker: 'test-tracker', timeoutMs: 5000 });
    });

    it.each([
      'safepay-inframe__cardinal-3ds__success',
      'safepay-inframe__cardinal-3ds__failure',
      'safepay-inframe__payment__declined',
      'safepay-inframe__enrollment__failed',
      'safepay-error',
    ])('does not fire once %s arrives', (outcome) => {
      const onPayerAuthenticationTimeout = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />);
      requireChallenge();
      act(() => { capturedOnInframeEvent?.(outcome, {}); });
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationTimeout).not.toHaveBeenCalled();
    });

    it('does not start for frictionless authentication', () => {
      const onPayerAuthenticationTimeout = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__frictionless', {}); });
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationTimeout).not.toHaveBeenCalled();
    });

    it('is disabled when authenticationTimeoutMs is 0', () => {
      const onPayerAuthenticationTimeout = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={0} onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />);
      requireChallenge();
      act(() => { vi.advanceTimersByTime(DEFAULT_AUTHENTICATION_TIMEOUT_MS * 2); });
      expect(onPayerAuthenticationTimeout).not.toHaveBeenCalled();
    });

    it('is cleared on unmount and when the tracker changes', () => {
      const onPayerAuthenticationTimeout = vi.fn();
      const { rerender, unmount } = render(
        <PayerAuthentication {...defaultProps} tracker="trk_1" authenticationTimeoutMs={5000} onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />
      );
      requireChallenge();
      rerender(<PayerAuthentication {...defaultProps} tracker="trk_2" authenticationTimeoutMs={5000} onPayerAuthenticationTimeout={onPayerAuthenticationTimeout} />);
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationTimeout).not.toHaveBeenCalled();

      requireChallenge();
      unmount();
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationTimeout).not.toHaveBeenCalled();
    });
  });
});
