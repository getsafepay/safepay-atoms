import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { render, act, screen } from '@testing-library/react';
import { Environment } from '../../types/environment';
import CardCapture from './index';

// Mock InframeComponent — tests fire events via capturedOnInframeEvent
vi.mock('./iframe', () => ({ default: vi.fn() }));

import InframeComponent from './iframe';

let capturedOnInframeEvent: ((name: string, detail: any) => void) | undefined;

beforeEach(() => {
  capturedOnInframeEvent = undefined;
  vi.mocked(InframeComponent).mockImplementation(({ src, onInframeEvent }: any) => {
    capturedOnInframeEvent = onInframeEvent;
    return React.createElement('iframe', { 'data-testid': 'card-iframe', src });
  });
});

const defaultProps = {
  environment: Environment.Sandbox,
  authToken: 'test-token',
  tracker: 'test-tracker',
  validationEvent: 'submit',
  imperativeRef: createRef<any>(),
};

describe('CardCapture', () => {
  it('renders an iframe pointing at the sandbox cardlink URL', () => {
    render(<CardCapture {...defaultProps} />);
    const iframe = screen.getByTestId('card-iframe');
    expect(iframe.getAttribute('src')).toContain('sandbox.api.getsafepay.com/drops/cardlink');
  });

  it('renders an iframe pointing at the development cardlink URL', () => {
    render(<CardCapture {...defaultProps} environment={Environment.Development} />);
    const iframe = screen.getByTestId('card-iframe');
    expect(iframe.getAttribute('src')).toContain('dev.api.getsafepay.com/drops/cardlink');
  });

  it('calls onReady when the ready event fires', () => {
    const onReady = vi.fn();
    render(<CardCapture {...defaultProps} onReady={onReady} />);
    act(() => { capturedOnInframeEvent?.('safepay-inframe__ready', {}); });
    expect(onReady).toHaveBeenCalledOnce();
  });

  it('calls onProceedToAuthentication with DDC data when the proceed event fires', () => {
    const onProceedToAuthentication = vi.fn();
    render(<CardCapture {...defaultProps} onProceedToAuthentication={onProceedToAuthentication} />);
    const detail = { accessToken: 'ddc-jwt', deviceDataCollectionURL: 'https://example.com/ddc' };
    act(() => { capturedOnInframeEvent?.('safepay-inframe__proceed__authentication', detail); });
    expect(onProceedToAuthentication).toHaveBeenCalledWith(detail);
  });

  it('calls onError when an error event fires', () => {
    const onError = vi.fn();
    render(<CardCapture {...defaultProps} onError={onError} />);
    act(() => { capturedOnInframeEvent?.('safepay-inframe__error', { errorMessage: 'bad card' }); });
    expect(onError).toHaveBeenCalledWith('bad card');
  });

  it('calls onValidated when the validated event fires', () => {
    const onValidated = vi.fn();
    render(<CardCapture {...defaultProps} onValidated={onValidated} />);
    act(() => { capturedOnInframeEvent?.('safepay-inframe__validated', {}); });
    expect(onValidated).toHaveBeenCalledOnce();
  });

  it('populates imperativeRef with submit, validate, fetchValidity and clear', () => {
    const imperativeRef = createRef<any>();
    render(<CardCapture {...defaultProps} imperativeRef={imperativeRef} />);
    expect(typeof imperativeRef.current?.submit).toBe('function');
    expect(typeof imperativeRef.current?.validate).toBe('function');
    expect(typeof imperativeRef.current?.fetchValidity).toBe('function');
    expect(typeof imperativeRef.current?.clear).toBe('function');
  });
});
