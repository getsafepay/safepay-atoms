import React, { useState, useEffect, useRef, useMemo } from "react";
import InframeComponent from "./iframe";
import { resolveBaseUrl } from "../../utils/funcs/resolveBaseUrl";
import {
  useAppendStyles,
  loadPayerAuthenticationStylesAndJsChunks,
} from "../../styles";

interface PayerAuthData {
  tracker: string;
  request_id: string;
}

interface PayerAuthErrorData extends PayerAuthData {
  error: string;
}

interface PayerAuthSuccessData extends PayerAuthData {
  authorization?: string;
  payment_method?: string;
}

interface PayerAuthenticationProps {
  environment: string;
  threeDSJWT: string;
  threeDSURL: string;
  onPayerAuthenticationFailure?: (data: PayerAuthErrorData) => void;
  onPayerAuthenticationSuccess?: (data: PayerAuthSuccessData) => void; // Define a more specific type for newCard if possible
  imperativeRef: React.MutableRefObject<any>; // Replace 'any' with a specific type if possible
}

const PayerAuthentication: React.FC<PayerAuthenticationProps> = ({
  environment,
  threeDSJWT,
  threeDSURL,
  onPayerAuthenticationFailure = () => {},
  onPayerAuthenticationSuccess = () => {},
  imperativeRef,
}: PayerAuthenticationProps): React.ReactElement => {
  // Custom hook usage for appending styles and managing iframe methods
  const styleRef = useAppendStyles("PayerAuth", false);
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
  const baseURL = resolveBaseUrl(environment);

  // Computed props for iframe integration
  const computedProps = useMemo(
    () => ({
      environment,
      threeDSJWT,
      threeDSURL,
      inputStyle: { ...styles },
    }),
    [styles, environment, threeDSJWT, threeDSURL],
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
      case "safepay-inframe__cardinal-3ds__failure":
        onPayerAuthenticationFailure(data);
        break;
      case "safepay-inframe__cardinal-3ds__success":
        onPayerAuthenticationSuccess(data);
        break;
      default:
        // Additional event handling as necessary
        break;
    }
  };

  // Component rendering with conditional styles and iframe integration
  return (
    <div className="safepay-drops-root" ref={styleRef}>
      <div className={`iframeWrapper`}>
        <InframeComponent
          src={`${baseURL}/threeds`}
          title="Safepay PayerAuthentication"
          ref={inframeMethodsRef}
          onInframeEvent={handleInframeEvent}
          inframeProps={computedProps}
        />
      </div>
    </div>
  );
};

loadPayerAuthenticationStylesAndJsChunks();

export default PayerAuthentication;
