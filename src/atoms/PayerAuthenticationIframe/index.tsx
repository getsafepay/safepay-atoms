import React, { useEffect, useMemo, useRef } from 'react';
import '../../styles/css/index.css';
import '../../styles/css/payer-auth.css';
import '../../styles/css/seamless-iframe.css';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import InframeComponent from './iframe';
import { PayerAuthenticationProps } from './types';

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
  const inframeMethodsRef = useRef<any>(); // Should ideally specify a more detailed type

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
      authorizationOptions
    }),
    [
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
