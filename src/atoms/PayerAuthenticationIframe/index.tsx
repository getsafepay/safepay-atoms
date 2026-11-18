import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppendStyles } from '../../styles';
import { appendParentOriginToIframeSrc } from '../../utils/funcs/bridgeOrigin';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import InframeComponent from './iframe';
import { PayerAuthenticationError, PayerAuthenticationProps } from './types';
import { toEnvironment } from '../../types/environment';

export * from './types';

/** Default wait for a 3DS challenge outcome: 10 minutes. */
export const DEFAULT_AUTHENTICATION_TIMEOUT_MS = 10 * 60 * 1000;

const PayerAuthentication = ({
  environment,
  tracker,
  authToken,
  deviceDataCollectionJWT,
  deviceDataCollectionURL,
  discountBody,
  user = '',
  billing,
  authorizationOptions = {},
  // No default: whether the merchant provided it decides whether negative
  // outcomes report through the unified callback or the deprecated ones.
  onPayerAuthenticationError,
  onPayerAuthenticationFailure = () => {},
  onPayerAuthenticationSuccess = () => {},
  onPayerAuthenticationRequired = () => {},
  onPayerAuthenticationFrictionless = () => {},
  onPayerAuthenticationUnavailable = () => {},
  onSafepayError = () => {},
  authenticationTimeoutMs = DEFAULT_AUTHENTICATION_TIMEOUT_MS,
  imperativeRef,
}: PayerAuthenticationProps): React.ReactElement => {
  // Custom hook usage for appending styles and managing iframe methods
  const styleRef = useAppendStyles('PayerAuthentication', false);
  const inframeMethodsRef = useRef<any>(); // Should ideally specify a more detailed type

  // Component state management for UI and validation states
  const [styles, setStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Styles computation and application logic
    if (!styleRef.current) return;
    const computedStyles = {}; // Placeholder for actual style computation logic
    setStyles(computedStyles);
  }, [styleRef]);

  // Base URL resolution based on the environment
  const normalizedEnv = toEnvironment(environment);
  const baseURL = resolveBaseUrl(normalizedEnv);
  const iframeSrc = useMemo(
    () =>
      appendParentOriginToIframeSrc(
        `${baseURL}/authlink`,
        typeof window === 'undefined' ? undefined : window.location.href
      ),
    [baseURL]
  );

  // Computed props for iframe integration
  const computedProps = useMemo(
    () => ({
      environment: normalizedEnv,
      tracker,
      authToken,
      deviceDataCollectionJWT,
      deviceDataCollectionURL,
      discountBody,
      billing,
      user,
      authorizationOptions,
      inputStyle: { ...styles },
    }),
    [
      styles,
      normalizedEnv,
      tracker,
      authToken,
      deviceDataCollectionJWT,
      deviceDataCollectionURL,
      discountBody,
      billing,
      user,
      authorizationOptions,
    ]
  );

  useEffect(() => {
    // Exposing component methods via imperativeRef for external control
    if (imperativeRef) {
      imperativeRef.current = {
        // submit: () => inframeMethodsRef.current.queueMethodCall("submit")
      };
    }
  }, [imperativeRef]);

  // Challenge timeout: started when a 3DS challenge is required, cleared by any
  // outcome. Covers shoppers abandoning the challenge and connections dropping
  // mid-challenge, where no outcome event would otherwise ever arrive.
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The timer can fire long after render, so keep the latest handler in a ref.
  const onErrorRef = useRef(onPayerAuthenticationError);
  onErrorRef.current = onPayerAuthenticationError;

  const clearChallengeTimeout = () => {
    if (timeoutIdRef.current !== undefined) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = undefined;
    }
  };

  const startChallengeTimeout = () => {
    clearChallengeTimeout();
    if (!(authenticationTimeoutMs > 0)) return;
    const timeoutMs = authenticationTimeoutMs;
    timeoutIdRef.current = setTimeout(() => {
      timeoutIdRef.current = undefined;
      // A timeout is only reported through the unified callback; the released
      // atom had no timeout callback, so legacy mode stays silent here.
      onErrorRef.current?.({ reason: 'timeout', tracker, timeoutMs });
    }, timeoutMs);
  };

  // Drops sends `payment__declined` immediately before the failure event
  // (`enrollment__failed` or `cardinal-3ds__failure`) for the same decline.
  // When `onPayerAuthenticationError` is provided, the decline is reported there
  // (reason `declined`) and the following failure event is suppressed so a
  // decline is reported once. Otherwise (legacy mode) the decline is reported
  // through the deprecated failure callback, as before `onPayerAuthenticationError`
  // existed. A ref, because both events can arrive before React re-renders.
  const declineReportedRef = useRef(false);

  // A new tracker is a new attempt; unmounting ends this one.
  useEffect(() => {
    declineReportedRef.current = false;
    return clearChallengeTimeout;
  }, [tracker]);

  /** True if the failure event that follows a reported decline should be skipped. */
  const consumeReportedDecline = () => {
    const reported = declineReportedRef.current;
    declineReportedRef.current = false;
    return reported;
  };

  // Negative outcomes route to the unified `onPayerAuthenticationError` when the
  // merchant provided it; otherwise they fall back to the deprecated callbacks.
  const errorHandlerSet = typeof onPayerAuthenticationError === 'function';
  const reportError = (error: PayerAuthenticationError) =>
    (onPayerAuthenticationError as (e: PayerAuthenticationError) => void)(error);

  // Event handling for iframe communications and interactions
  const handleInframeEvent = (event: string, data: any) => {
    switch (event) {
      case 'safepay-inframe__enrollment__required':
        startChallengeTimeout();
        onPayerAuthenticationRequired({ tracker });
        break;
      case 'safepay-inframe__enrollment__frictionless':
        clearChallengeTimeout();
        onPayerAuthenticationFrictionless(data);
        break;
      case 'safepay-inframe__payment__declined':
        clearChallengeTimeout();
        // A decline only surfaces on its own when the unified callback is set.
        // In legacy mode the following failure event reports it, as before.
        if (errorHandlerSet) {
          declineReportedRef.current = true;
          reportError({ reason: 'declined', tracker, ...data });
        }
        break;
      case 'safepay-inframe__enrollment__failed':
        clearChallengeTimeout();
        if (consumeReportedDecline()) break;
        if (errorHandlerSet) reportError({ reason: 'unavailable', tracker, ...data });
        else onPayerAuthenticationUnavailable({ tracker, ...data });
        break;
      case 'safepay-inframe__cardinal-3ds__failure':
        clearChallengeTimeout();
        if (consumeReportedDecline()) break;
        if (errorHandlerSet) reportError({ reason: 'failure', tracker, ...data });
        else onPayerAuthenticationFailure({ tracker, ...data });
        break;
      case 'safepay-inframe__cardinal-3ds__success':
        clearChallengeTimeout();
        onPayerAuthenticationSuccess(data);
        break;
      case 'safepay-error':
        clearChallengeTimeout();
        onSafepayError(data);
        break;
      default:
        // Additional event handling as necessary
        break;
    }
  };

  // Component rendering with conditional styles and iframe integration
  return (
    <div className="safepay-atoms-root" ref={styleRef}>
      <div className="payerAuthiframeWrapper">
        <InframeComponent
          src={iframeSrc}
          title="Safepay Payer Authentication"
          ref={inframeMethodsRef}
          onInframeEvent={handleInframeEvent}
          inframeProps={computedProps}
        />
      </div>
    </div>
  );
};

export default PayerAuthentication;
