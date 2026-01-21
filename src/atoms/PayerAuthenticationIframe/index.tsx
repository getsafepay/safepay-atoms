import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppendStyles } from '../../styles';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import InframeComponent from './iframe';
import { PayerAuthenticationProps } from './types';
import { toEnvironment } from '../../types/environment';

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

  // Event handling for iframe communications and interactions
  const handleInframeEvent = (event: string, data: any) => {
    switch (event) {
      case 'safepay-inframe__enrollment__required':
        onPayerAuthenticationRequired({ tracker });
        break;
      case 'safepay-inframe__enrollment__frictionless':
        onPayerAuthenticationFrictionless(data);
        break;
      case 'safepay-inframe__enrollment__failed':
        onPayerAuthenticationUnavailable({ tracker });
        break;
      case 'safepay-inframe__cardinal-3ds__failure':
        onPayerAuthenticationFailure(data);
        break;
      case 'safepay-inframe__cardinal-3ds__success':
        onPayerAuthenticationSuccess(data);
        break;
      case 'safepay-error':
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
          src={`${baseURL}/authlink`}
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
