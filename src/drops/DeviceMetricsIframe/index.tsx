import React, { useState, useEffect, useRef, useMemo } from "react";
import InframeComponent from "./iframe";
import { resolveBaseUrl } from "../../utils/funcs/resolveBaseUrl";
import {
  useAppendStyles,
  loadDeviceMetricsStylesAndJsChunks,
} from "../../styles";

interface DeviceMetricsProps {
  environment: string;
  deviceDataCollectionJWT: string;
  deviceDataCollectionURL: string;
  inputStyle: React.CSSProperties;
  onError?: (error: string) => void;
  onSuccess?: (sessionId: string) => void; // Define a more specific type for newCard if possible
  imperativeRef: React.MutableRefObject<any>; // Replace 'any' with a specific type if possible
}

/**
 * `DeviceMetrics` is a React component that securely collects device fingerprinting data
 * through an isolated iframe implementation. This component is essential for fraud prevention
 * and risk assessment in payment processing.
 *
 * The component renders an iframe that runs device fingerprinting scripts to collect
 * non-sensitive information about the user's device, such as:
 * - Browser type and version
 * - Screen resolution
 * - Time zone
 * - Available browser plugins
 * - Other device characteristics
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.environment - Deployment environment ('sandbox' or 'production')
 * @param {string} props.deviceDataCollectionJWT - JWT token for authenticating device data collection
 * @param {string} props.deviceDataCollectionURL - Endpoint URL for submitting collected device data
 * @param {React.CSSProperties} props.inputStyle - Custom styles for the iframe container
 * @param {(error: string) => void} [props.onError] - Callback triggered when data collection fails
 * @param {(sessionId: string) => void} [props.onSuccess] - Callback triggered when device data is successfully collected
 * @param {React.MutableRefObject<any>} props.imperativeRef - Ref for accessing component methods externally
 *
 * @returns {React.ReactElement} A React element containing the device metrics collection iframe
 *
 * @example
 * <DeviceMetrics
 *   environment="sandbox"
 *   deviceDataCollectionJWT="eyJhbGciOiJIUzI1NiIs..."
 *   deviceDataCollectionURL="https://api.sandbox.getsafepay.com/device-data"
 *   inputStyle={{ height: '0', width: '0', border: 'none' }}
 *   onError={(error) => console.error('Device data collection failed:', error)}
 *   onSuccess={(sessionId) => console.log('Device data collected, session:', sessionId)}
 *   imperativeRef={metricsRef}
 * />
 *
 * The component handles the secure collection of device data while maintaining isolation
 * from the main application through the iframe boundary. This data is crucial for:
 * - Fraud detection and prevention
 * - Risk assessment
 * - Device fingerprinting
 * - Transaction security enhancement
 *
 * The collected data is sent to Safepay's servers using the provided JWT for authentication,
 * and the results are communicated back through the onSuccess/onError callbacks.
 */

const DeviceMetrics: React.FC<DeviceMetricsProps> = ({
  environment,
  deviceDataCollectionJWT,
  deviceDataCollectionURL,
  inputStyle,
  onError = (e) => {},
  onSuccess = (sessionId) => {},
  imperativeRef,
}: DeviceMetricsProps): React.ReactElement => {
  // Custom hook usage for appending styles and managing iframe methods
  const styleRef = useAppendStyles("DeviceMetrics", false);
  const inframeMethodsRef = useRef<any>(); // Should ideally specify a more detailed type

  // Component state management for UI and validation states
  const [styles, setStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Styles computation and application logic
    if (!styleRef.current) return;
    const computedStyles = {}; // Placeholder for actual style computation logic
    setStyles(computedStyles);
  }, [inputStyle, styleRef]);

  // Base URL resolution based on the environment
  const baseURL = resolveBaseUrl(environment);

  // Computed props for iframe integration
  const computedProps = useMemo(
    () => ({
      environment,
      deviceDataCollectionJWT,
      deviceDataCollectionURL,
      inputStyle: { ...styles, ...inputStyle },
    }),
    [
      styles,
      inputStyle,
      environment,
      deviceDataCollectionJWT,
      deviceDataCollectionURL,
    ],
  );

  useEffect(() => {
    // Exposing component methods via imperativeRef for external control
    if (imperativeRef) {
      imperativeRef.current = {
        // submit: () => inframeMethodsRef.current.queueMethodCall("submit"),
        // validate: () => inframeMethodsRef.current.queueMethodCall("validate"),
        // fetchValidity: async () => {
        //   inframeMethodsRef.current.queueMethodCall("fetchValidity");
        //   return new Promise((resolve) => {
        //     validationCallbackRef.current = resolve;
        //   });
        // },
        // clear: () => inframeMethodsRef.current.queueMethodCall("clear"),
      };
    }
  }, [imperativeRef]);

  // Event handling for iframe communications and interactions
  const handleInframeEvent = (event: string, data: any) => {
    switch (event) {
      case "safepay-inframe__error":
        const error = data.errorMessage;
        onError(error);
        break;
      case "safepay-inframe__success":
        const sessionId = data.sessionId;
        onSuccess(sessionId);
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
          src={`${baseURL}/device`}
          title="Safepay Device Metrics"
          ref={inframeMethodsRef}
          onInframeEvent={handleInframeEvent}
          inframeProps={computedProps}
        />
      </div>
    </div>
  );
};

loadDeviceMetricsStylesAndJsChunks();

export default DeviceMetrics;
