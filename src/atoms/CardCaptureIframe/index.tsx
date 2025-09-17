import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppendStyles } from '../../styles';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import InframeComponent from './iframe';
import { Environment, toEnvironment } from '../../types/environment';

interface CardCaptureProps {
  environment: Environment | string;
  authToken: string;
  tracker: string;
  validationEvent: string;
  onDiscountApplied?: (payload: any) => void;
  onProceedToAuthentication?: (data: any) => void;
  onValidated?: () => void;
  onError?: (error: string) => void;
  imperativeRef: React.MutableRefObject<any>; // Replace 'any' with a specific type if possible
}

/**
 * `CardCapture` is a React functional component designed to securely capture credit or debit card information.
 * It leverages an iframe to isolate the card input field from the rest of the application, enhancing security by
 * ensuring card data is not directly accessible by the parent application's DOM. This component is highly customizable,
 * allowing for various styles, event handling, and integration with different environments and authentication tokens.
 *
 * @component
 * @param {Object} props - The properties passed to the CardCapture component.
 * @param {Environment} props.environment - The environment for the card input (enum or string).
 * @param {string} props.authToken - An authentication token required for validating and processing the card information securely.
 * @param {(accessToken?: string, actionUrl?: string) => void} [props.onProceedToAuthentication] - An optional callback function triggered when additional authentication challenge is required. Receives optional accessToken and actionUrl parameters.
 * @param {string} [props.validationEvent="submit"] - Specifies when the card validation should occur. Defaults to 'submit'.
 * @param {(error: string) => void} [props.onError] - An optional callback function triggered upon encountering an error during card input processing.
 * @param {() => void} [props.onValidated] - An optional callback function triggered when the card input passes validation checks.
 * @param {(payload: { appliedDiscount: any; selection: any }) => void} [props.onDiscountApplied] - An optional callback invoked when a discount is applied inside the iframe.
 * @param {() => void} [props.onEnterKeyPress] - An optional callback function triggered when the Enter key is pressed within the card input field.
 * @param {React.MutableRefObject<any>} props.imperativeRef - A ref object used to expose component methods for external control. The type of `any` should be replaced with a more specific type if possible.
 *
 * @returns {React.ReactElement} A React element representing the card input interface and its container.
 *
 * @example
 * <CardCapture
 *   environment="sandbox"
 *   authToken="yourAuthToken"
 *   tracker="yourTracker"
 *   validationEvent="submit"
 *   onError={(error) => console.error(error)}
 *   onValidated={() => console.log('Card validated.')}
 *   imperativeRef={CardCaptureRef}
 * />
 *
 * This component uses React hooks for managing state, effects, and refs, providing a modern approach to handling user interactions and component lifecycle.
 */
const CardCapture = ({
    environment,
    authToken,
    tracker,
    validationEvent,
    onValidated = () => {},
    onDiscountApplied = () => {},
    onProceedToAuthentication = () => {},
    onError = (e: string) => {},
    imperativeRef,
}: CardCaptureProps): JSX.Element => {
  // Custom hook usage for appending styles and managing iframe methods
  const styleRef = useAppendStyles('CardAtom', false);
  const inframeMethodsRef = useRef<any>(); // Should ideally specify a more detailed type
  const validationCallbackRef = useRef<(isValid: boolean) => void>();

  // Component state management for UI and validation states
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [styles, setStyles] = useState<React.CSSProperties>({});

  // Base URL resolution based on the environment
  const normalizedEnv = toEnvironment(environment);
  const baseURL = resolveBaseUrl(normalizedEnv);

  useEffect(() => {
    // Styles computation and application logic
    if (!styleRef.current) return;
    const computedStyles = {}; // Placeholder for actual style computation logic
    setStyles(computedStyles);
  }, [styleRef]);

  // Computed props for iframe integration
  const computedProps = useMemo(
    () => ({
      environment: normalizedEnv,
      authToken,
      tracker,
      inputStyle: { ...styles },
      validationEvent,
    }),
    [styles, normalizedEnv, authToken, tracker, validationEvent]
  );

  useEffect(() => {
    // Exposing component methods via imperativeRef for external control
    if (imperativeRef) {
      imperativeRef.current = {
        submit: () => inframeMethodsRef.current.queueMethodCall('submit'),
        validate: () => inframeMethodsRef.current.queueMethodCall('validate'),
        fetchValidity: async () => {
          inframeMethodsRef.current.queueMethodCall('fetchValidity');
          return new Promise((resolve) => {
            validationCallbackRef.current = resolve;
          });
        },
        clear: () => inframeMethodsRef.current.queueMethodCall('clear'),
      };
    }
  }, [imperativeRef]);

  // Event handling for iframe communications and interactions
  const handleInframeEvent = (event: string, data: any) => {
    switch (event) {
      // Focus and blur states management
      case 'safepay-inframe__focus':
        setIsFocused(true);
        break;
      case 'safepay-inframe__blur':
        setIsFocused(false);
        break;
      // Callback invocations based on specific iframe events
      case 'safepay-inframe__error':
      case 'safepay-inframe__card-tokenization__failure':
        const error = data.errorMessage;
        setErrorMessage(error);
        onError(error);
        break;
      // case "safepay-inframe__success":
      //   onSuccess(data.newCard);
      //   break;
      case 'safepay-inframe__validated':
        setErrorMessage(undefined);
        onValidated();
        break;
      case 'safepay-inframe__fetch-validity':
        if (validationCallbackRef.current) {
          validationCallbackRef.current(data.isValid);
          validationCallbackRef.current = undefined;
        }
        break;
      case 'safepay-inframe__proceed__authentication':
        onProceedToAuthentication(data);
        break;
      case 'safepay-inframe__discountApplied':
        // Expected payload shape: { appliedDiscount, selection: appliedDiscountObj }
        onDiscountApplied(data);
        break;
      case 'safepay-error':
        const { error: safepayError } = data;
        setErrorMessage(safepayError.message);
        onError(safepayError);
        break;
      default:
        // Additional event handling as necessary
        break;
    }
  };

  // Component rendering with conditional styles and iframe integration
  return (
    <div className="safepay-atoms-root" ref={styleRef}>
      <div className={`iframeWrapper ${isFocused ? 'focus' : ''}`}>
        <InframeComponent
          src={`${baseURL}/cardlink`}
          title="Safepay Credit/Debit Card Input"
          ref={inframeMethodsRef}
          onInframeEvent={handleInframeEvent}
          inframeProps={computedProps}
        />
      </div>
      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
    </div>
  );
};

export default CardCapture;
