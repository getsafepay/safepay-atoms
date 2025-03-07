import React, { useState, useEffect, useRef, useMemo } from 'react';
import InframeComponent from './iframe';
import { resolveBaseUrl } from '../../utils/funcs/resolveBaseUrl';
import { useAppendStyles, loadCardLinkStylesAndJsChunks } from '../../styles';

interface CardCaptureProps {
  environment: string;
  authToken: string;
  tracker: string;
  validationEvent: string;
  onRequireChallenge?: (accessToken?: string, actionUrl?: string) => void;
  onProceedToAuthorization?: () => void;
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
 * @param {string} props.environment - The environment in which the card input is operating, e.g., 'sandbox' or 'production'.
 * @param {string} props.authToken - An authentication token required for validating and processing the card information securely.
 * @param {(accessToken?: string, actionUrl?: string) => void} [props.onRequireChallenge] - An optional callback function triggered when additional authentication challenge is required. Receives optional accessToken and actionUrl parameters.
 * @param {() => void} [props.onProceedToAuthorization] - An optional callback function triggered when the authentication flow proceeds to authorization without requiring additional challenges.
 * @param {string} [props.validationEvent="submit"] - Specifies when the card validation should occur. Defaults to 'submit'.
 * @param {(error: string) => void} [props.onError] - An optional callback function triggered upon encountering an error during card input processing.
 * @param {() => void} [props.onValidated] - An optional callback function triggered when the card input passes validation checks.
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
const CardCapture: React.FC<CardCaptureProps> = ({
  environment,
  authToken,
  tracker,
  validationEvent,
  onValidated = () => {},
  onRequireChallenge = () => {},
  onProceedToAuthorization = () => {},
  onError = (e) => {},
  imperativeRef,
}: CardCaptureProps): React.ReactElement => {
  // Custom hook usage for appending styles and managing iframe methods
  const styleRef = useAppendStyles('CardAtom', false);
  const inframeMethodsRef = useRef<any>(); // Should ideally specify a more detailed type
  const validationCallbackRef = useRef<(isValid: boolean) => void>();

  // Component state management for UI and validation states
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [styles, setStyles] = useState<React.CSSProperties>({});

  // Base URL resolution based on the environment
  const baseURL = resolveBaseUrl(environment);

  useEffect(() => {
    // Styles computation and application logic
    if (!styleRef.current) return;
    const computedStyles = {}; // Placeholder for actual style computation logic
    setStyles(computedStyles);
  }, [styleRef]);

  // Computed props for iframe integration
  const computedProps = useMemo(
    () => ({
      environment,
      authToken,
      tracker,
      inputStyle: { ...styles },
      validationEvent,
    }),
    [styles, environment, authToken, tracker, validationEvent]
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
      case 'safepay-inframe__enrollment__failed':
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
      case 'safepay-inframe__enrollment__required':
        onRequireChallenge(data.accessToken, data.actionUrl);
        break;
      case 'safepay-inframe__enrollment__frictionless':
        onProceedToAuthorization();
        break;
      default:
        // Additional event handling as necessary
        break;
    }
  };

  // Component rendering with conditional styles and iframe integration
  return (
    <div className="safepay-drops-root" ref={styleRef}>
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

loadCardLinkStylesAndJsChunks();

export default CardCapture;
