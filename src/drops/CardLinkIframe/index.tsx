import React, { useState, useEffect, useRef, useMemo } from "react";
import InframeComponent from "./iframe";
import { resolveBaseUrl } from "../../utils/funcs/resolveBaseUrl";
import { useAppendStyles, loadCardLinkStylesAndJsChunks } from "../../styles";

interface CardInputProps {
  captureContext: string;
  environment: string;
  inputStyle: React.CSSProperties;
  validationEvent?: string;
  onError?: (error: string) => void;
  onSuccess?: (newCard: any) => void; // Define a more specific type for newCard if possible
  onValidated?: () => void;
  onEnterKeyPress?: () => void;
  imperativeRef: React.MutableRefObject<any>; // Replace 'any' with a specific type if possible
}

const CardInput: React.FC<CardInputProps> = ({
  captureContext,
  environment,
  inputStyle,
  validationEvent = "submit",
  onError = (e) => {},
  onSuccess = (c) => {},
  onValidated = () => {},
  onEnterKeyPress = () => {},
  imperativeRef,
}) => {
  const styleRef = useAppendStyles("CardLink", false);
  const inframeMethodsRef = useRef<any>(); // Replace 'any' with a specific type if possible
  const validationCallbackRef = useRef<(isValid: boolean) => void>();

  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [styles, setStyles] = useState<React.CSSProperties>({});

  const baseURL = resolveBaseUrl(environment);

  useEffect(() => {
    if (!styleRef.current) return;
    // Implement style computation logic
    const computedStyles = {}; // Replace with actual logic
    setStyles(computedStyles);
  }, [inputStyle, styleRef]);

  const computedProps = useMemo(
    () => ({
      captureContext,
      environment,
      inputStyle: { ...styles, ...inputStyle },
      validationEvent,
      waitFor: "payment-method",
    }),
    [styles, environment, inputStyle, validationEvent, captureContext]
  );

  useEffect(() => {
    // Expose methods to parent components
    if (imperativeRef) {
      imperativeRef.current = {
        submit: () => inframeMethodsRef.current.queueMethodCall("submit"),
        validate: () => inframeMethodsRef.current.queueMethodCall("validate"),
        fetchValidity: async () => {
          inframeMethodsRef.current.queueMethodCall("fetchValidity");
          return new Promise((resolve) => {
            validationCallbackRef.current = resolve;
          });
        },
        clear: () => inframeMethodsRef.current.queueMethodCall("clear"),
      };
    }
  }, [imperativeRef]);

  const handleInframeEvent = (event: string, data: any) => {
    switch (event) {
      case "safepay-inframe__focus":
        setIsFocused(true);
        break;
      case "safepay-inframe__blur":
        setIsFocused(false);
        break;
      case "safepay-inframe__enter-key":
        onEnterKeyPress();
        break;
      case "safepay-inframe__error":
        const error = data.errorMessage;
        setErrorMessage(error);
        onError(error);
        break;
      case "safepay-inframe__success":
        onSuccess(data.newCard);
        break;
      case "safepay-inframe__validated":
        setErrorMessage(undefined);
        onValidated();
        break;
      case "safepay-inframe__fetch-validity":
        if (validationCallbackRef.current) {
          validationCallbackRef.current(data.isValid);
          validationCallbackRef.current = undefined;
        }
        break;
      default:
        // Handle other events if necessary
        break;
    }
  };

  return (
    <div className="safepay-drops-root" ref={styleRef}>
      <div className={`iframeWrapper ${isFocused && "focus"}`}>
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

export default CardInput;
