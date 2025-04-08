import React, { useState, useEffect, useRef, useMemo } from 'react';
import InframeComponent from './iframe';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import { PayerAuthenticationProps } from './types';
import '../../styles/css/index.css';
import '../../styles/css/payer-auth.css';
import '../../styles/css/seamless-iframe.css';

const PayerAuthentication: React.FC<PayerAuthenticationProps> = ({
  environment,
  tracker,
  authToken,
  deviceDataCollectionJWT,
  deviceDataCollectionURL,
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
  // const styleRef = useAppendStyles('PayerAuthentication', false);
  const inframeMethodsRef = useRef<any>(); // Should ideally specify a more detailed type

  // Component state management for UI and validation states
  const [styles, setStyles] = useState<React.CSSProperties>({});

  // useEffect(() => {
  //   // Styles computation and application logic
  //   if (!styleRef.current) return;
  //   const computedStyles = {}; // Placeholder for actual style computation logic
  //   setStyles(computedStyles);
  // }, [styleRef]);

  // Base URL resolution based on the environment
  const baseURL = resolveBaseUrl(environment);

  // Computed props for iframe integration
  const computedProps = useMemo(
    () => ({
      environment,
      tracker,
      authToken,
      deviceDataCollectionJWT,
      deviceDataCollectionURL,
      billing,
      authorizationOptions,
      inputStyle: { ...styles },
    }),
    [
      styles,
      environment,
      tracker,
      authToken,
      deviceDataCollectionJWT,
      deviceDataCollectionURL,
      authorizationOptions,
      billing,
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
    <div className="safepay-atoms-root">
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
