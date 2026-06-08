import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { render, act, screen } from '@testing-library/react';
import { Environment } from '../../types/environment';
import PayerAuthentication from './index';

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
});
