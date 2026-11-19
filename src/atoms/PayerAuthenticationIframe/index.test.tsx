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

  const declined = {
    errorMessage: 'Insufficient funds',
    responseCode: '51',
    merchantAdvice: { code: '01', codeRaw: 'M001' },
  };

  // Records the `reason` of each onPayerAuthenticationError call, in order.
  const recordReasons = (reasons: string[]) => ({
    onPayerAuthenticationError: (e: any) => reasons.push(e.reason),
  });

  describe('negative outcomes via onPayerAuthenticationError', () => {
    it('reports a decline with reason "declined" and the decline details', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_d" onPayerAuthenticationError={onPayerAuthenticationError} />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined); });
      expect(onPayerAuthenticationError).toHaveBeenCalledWith({ reason: 'declined', tracker: 'trk_d', ...declined });
    });

    it('reports a plain challenge failure with reason "failure"', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_f" onPayerAuthenticationError={onPayerAuthenticationError} />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__failure', { error: 'authentication failed' }); });
      expect(onPayerAuthenticationError).toHaveBeenCalledWith({ reason: 'failure', tracker: 'trk_f', error: 'authentication failed' });
    });

    it('reports a plain enrollment failure with reason "unavailable"', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_u" onPayerAuthenticationError={onPayerAuthenticationError} />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', { errorMessage: 'no 3DS' }); });
      expect(onPayerAuthenticationError).toHaveBeenCalledWith({ reason: 'unavailable', tracker: 'trk_u', errorMessage: 'no 3DS' });
    });

    it('reports a frictionless decline once (reason "declined"), suppressing the enrollment failure', () => {
      const reasons: string[] = [];
      render(<PayerAuthentication {...defaultProps} {...recordReasons(reasons)} />);
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined);
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', { errorMessage: 'Insufficient funds' });
      });
      expect(reasons).toEqual(['declined']);
    });

    it('reports a challenge decline once (reason "declined"), suppressing the challenge failure', () => {
      const reasons: string[] = [];
      render(<PayerAuthentication {...defaultProps} {...recordReasons(reasons)} />);
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined);
        capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__failure', { error: 'Insufficient funds' });
      });
      expect(reasons).toEqual(['declined']);
    });

    it('still reports non-decline failures', () => {
      const reasons: string[] = [];
      render(<PayerAuthentication {...defaultProps} {...recordReasons(reasons)} />);
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__failure', { error: 'authentication failed' });
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', { errorMessage: 'unable to authenticate' });
      });
      expect(reasons).toEqual(['failure', 'unavailable']);
    });

    it('only suppresses the failure event that belongs to the reported decline', () => {
      const reasons: string[] = [];
      render(<PayerAuthentication {...defaultProps} {...recordReasons(reasons)} />);
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined);
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', {});
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', {});
      });
      expect(reasons).toEqual(['declined', 'unavailable']);
    });

    it('does not carry a reported decline over to a new tracker', () => {
      const reasons: string[] = [];
      const props = { ...defaultProps, ...recordReasons(reasons) };
      const { rerender } = render(<PayerAuthentication {...props} tracker="trk_1" />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined); });
      rerender(<PayerAuthentication {...props} tracker="trk_2" />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', {}); });
      expect(reasons).toEqual(['declined', 'unavailable']);
    });

    it('does not call the deprecated callbacks when onPayerAuthenticationError is provided', () => {
      const onPayerAuthenticationFailure = vi.fn();
      const onPayerAuthenticationUnavailable = vi.fn();
      const onPayerAuthenticationError = vi.fn();
      render(
        <PayerAuthentication
          {...defaultProps}
          onPayerAuthenticationError={onPayerAuthenticationError}
          onPayerAuthenticationFailure={onPayerAuthenticationFailure}
          onPayerAuthenticationUnavailable={onPayerAuthenticationUnavailable}
        />
      );
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__failure', { error: 'x' });
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', {});
      });
      expect(onPayerAuthenticationFailure).not.toHaveBeenCalled();
      expect(onPayerAuthenticationUnavailable).not.toHaveBeenCalled();
      expect(onPayerAuthenticationError).toHaveBeenCalledTimes(2);
    });
  });

  describe('negative outcomes without onPayerAuthenticationError (legacy fallback)', () => {
    it('reports a frictionless decline through onPayerAuthenticationUnavailable', () => {
      const onPayerAuthenticationUnavailable = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_d" onPayerAuthenticationUnavailable={onPayerAuthenticationUnavailable} />);
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined);
        capturedOnInframeEvent?.('safepay-inframe__enrollment__failed', { errorMessage: 'Insufficient funds' });
      });
      expect(onPayerAuthenticationUnavailable).toHaveBeenCalledTimes(1);
      expect(onPayerAuthenticationUnavailable).toHaveBeenCalledWith({ tracker: 'trk_d', errorMessage: 'Insufficient funds' });
    });

    it('reports a decline after a challenge through onPayerAuthenticationFailure', () => {
      const onPayerAuthenticationFailure = vi.fn();
      render(<PayerAuthentication {...defaultProps} onPayerAuthenticationFailure={onPayerAuthenticationFailure} />);
      const failure = { error: 'Insufficient funds', response_code: '51' };
      act(() => {
        capturedOnInframeEvent?.('safepay-inframe__payment__declined', declined);
        capturedOnInframeEvent?.('safepay-inframe__cardinal-3ds__failure', failure);
      });
      expect(onPayerAuthenticationFailure).toHaveBeenCalledTimes(1);
      expect(onPayerAuthenticationFailure).toHaveBeenCalledWith({ tracker: 'test-tracker', ...failure });
    });
  });

  describe('authentication timeout', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    const requireChallenge = () =>
      act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__required', {}); });

    it('fires reason "timeout" once after 10 minutes by default when a challenge gets no outcome', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} tracker="trk_t" onPayerAuthenticationError={onPayerAuthenticationError} />);
      requireChallenge();

      act(() => { vi.advanceTimersByTime(DEFAULT_AUTHENTICATION_TIMEOUT_MS - 1); });
      expect(onPayerAuthenticationError).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(1); });
      expect(onPayerAuthenticationError).toHaveBeenCalledTimes(1);
      expect(onPayerAuthenticationError).toHaveBeenCalledWith({
        reason: 'timeout',
        tracker: 'trk_t',
        timeoutMs: DEFAULT_AUTHENTICATION_TIMEOUT_MS,
      });

      act(() => { vi.advanceTimersByTime(DEFAULT_AUTHENTICATION_TIMEOUT_MS); });
      expect(onPayerAuthenticationError).toHaveBeenCalledTimes(1);
    });

    it('honours a custom authenticationTimeoutMs', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} onPayerAuthenticationError={onPayerAuthenticationError} />);
      requireChallenge();
      act(() => { vi.advanceTimersByTime(5000); });
      expect(onPayerAuthenticationError).toHaveBeenCalledWith({ reason: 'timeout', tracker: 'test-tracker', timeoutMs: 5000 });
    });

    it.each([
      'safepay-inframe__cardinal-3ds__success',
      'safepay-inframe__cardinal-3ds__failure',
      'safepay-inframe__payment__declined',
      'safepay-inframe__enrollment__failed',
      'safepay-error',
    ])('does not fire a timeout once %s arrives', (outcome) => {
      const reasons: string[] = [];
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} {...recordReasons(reasons)} />);
      requireChallenge();
      act(() => { capturedOnInframeEvent?.(outcome, {}); });
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(reasons).not.toContain('timeout');
    });

    it('does not start for frictionless authentication', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} onPayerAuthenticationError={onPayerAuthenticationError} />);
      act(() => { capturedOnInframeEvent?.('safepay-inframe__enrollment__frictionless', {}); });
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationError).not.toHaveBeenCalled();
    });

    it('is disabled when authenticationTimeoutMs is 0', () => {
      const onPayerAuthenticationError = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={0} onPayerAuthenticationError={onPayerAuthenticationError} />);
      requireChallenge();
      act(() => { vi.advanceTimersByTime(DEFAULT_AUTHENTICATION_TIMEOUT_MS * 2); });
      expect(onPayerAuthenticationError).not.toHaveBeenCalled();
    });

    it('does not throw when a timeout fires with no onPayerAuthenticationError (legacy mode)', () => {
      const onPayerAuthenticationRequired = vi.fn();
      render(<PayerAuthentication {...defaultProps} authenticationTimeoutMs={5000} onPayerAuthenticationRequired={onPayerAuthenticationRequired} />);
      requireChallenge();
      expect(() => act(() => { vi.advanceTimersByTime(10_000); })).not.toThrow();
      expect(onPayerAuthenticationRequired).toHaveBeenCalledTimes(1);
    });

    it('is cleared on unmount and when the tracker changes', () => {
      const onPayerAuthenticationError = vi.fn();
      const { rerender, unmount } = render(
        <PayerAuthentication {...defaultProps} tracker="trk_1" authenticationTimeoutMs={5000} onPayerAuthenticationError={onPayerAuthenticationError} />
      );
      requireChallenge();
      rerender(<PayerAuthentication {...defaultProps} tracker="trk_2" authenticationTimeoutMs={5000} onPayerAuthenticationError={onPayerAuthenticationError} />);
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationError).not.toHaveBeenCalled();

      requireChallenge();
      unmount();
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(onPayerAuthenticationError).not.toHaveBeenCalled();
    });
  });
});
