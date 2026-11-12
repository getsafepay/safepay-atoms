import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppendStyles } from '../../styles';
import { appendParentOriginToIframeSrc } from '../../utils/funcs/bridgeOrigin';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import InframeComponent from './iframe';
import { PayerAuthenticationProps } from './types';
import { toEnvironment } from '../../types/environment';

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
  onPayerAuthenticationFailure = () => {},
  onPayerAuthenticationSuccess = () => {},
  onPayerAuthenticationRequired = () => {},
  onPayerAuthenticationFrictionless = () => {},
  onPayerAuthenticationUnavailable = () => {},
  onSafepayError = () => {},
  // No default: whether the merchant provided it decides how declines are reported.
  onPaymentDeclined,
  onPayerAuthenticationTimeout = () => {},
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
  const onTimeoutRef = useRef(onPayerAuthenticationTimeout);
  onTimeoutRef.current = onPayerAuthenticationTimeout;

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
      onTimeoutRef.current({ tracker, timeoutMs });
    }, timeoutMs);
  };

  // Drops sends `payment__declined` immediately before the failure event
  // (`enrollment__failed` or `cardinal-3ds__failure`) for the same decline.
  // When the merchant handles `onPaymentDeclined`, that failure event is
  // suppressed so a decline is reported once. Otherwise the decline is reported
  // through the failure callback, as before `onPaymentDeclined` existed.
  // A ref, because both events can arrive before React re-renders.
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
        if (typeof onPaymentDeclined === 'function') {
          declineReportedRef.current = true;
          onPaymentDeclined({ tracker, ...data });
        }
        break;
      case 'safepay-inframe__enrollment__failed':
        clearChallengeTimeout();
        if (consumeReportedDecline()) break;
        onPayerAuthenticationUnavailable({ tracker, ...data });
        break;
      case 'safepay-inframe__cardinal-3ds__failure':
        clearChallengeTimeout();
        if (consumeReportedDecline()) break;
        onPayerAuthenticationFailure(data);
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
