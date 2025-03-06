import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { loadSeamlessIframeStylesAndJsChunks } from "../../styles";
import useFunctionQueue from "../hooks/useFunctionQueue";

interface InframeProps {
  src: string;
  title: string;
  inframeProps?: any;
  onInframeEvent?: (eventName: string, detail: any) => void;
}

/**
 * `InframeComponent` is a React component designed to embed an iframe within a React application, providing
 * functionalities to handle iframe communications and events seamlessly. It supports passing properties to
 * the iframe content, handling events emitted from the iframe, and queuing method calls to the iframe, making
 * it versatile for a variety of use cases where an iframe integration is needed.
 *
 * @component
 * @param {Object} props - The properties passed to the InframeComponent.
 * @param {string} props.src - The source URL of the iframe content.
 * @param {string} props.title - The title of the iframe, used for accessibility.
 * @param {any} [props.inframeProps] - Optional properties that can be passed to the iframe content for initialization or configuration.
 * @param {(eventName: string, detail: any) => void} [props.onInframeEvent] - An optional callback function that is invoked when the iframe emits a custom event.
 * @param {React.Ref} ref - A React ref that provides access to the InframeComponent's methods.
 *
 * @returns {React.ReactElement} A React element representing the iframe and its container.
 *
 * @example
 * <InframeComponent
 *   src="https://example.com"
 *   title="Example Iframe"
 *   inframeProps={{ key: 'value' }}
 *   onInframeEvent={(eventName, detail) => console.log(eventName, detail)}
 * />
 *
 * This component utilizes React hooks for managing state, side effects, and refs. It listens for message events from the iframe,
 * processes them, and optionally triggers callbacks. It also exposes a method to queue calls to the iframe, ensuring that messages
 * are sent in order and handled correctly by the iframe's content.
 */
const InframeComponent = forwardRef(
  (
    { src, title, inframeProps, onInframeEvent = (e, d) => {} }: InframeProps,
    ref,
  ) => {
    const [isReady, setIsReady] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const messagesProcessedCallback = useRef<(() => void) | null>(null);
    const functionQueue = useFunctionQueue();

    useEffect(() => {
      // Message event handler for iframe communications
      const messageHandler = (event: MessageEvent) => {
        if (
          iframeRef.current &&
          event.source === iframeRef.current.contentWindow &&
          event.data.type === "safepay-inframe-event"
        ) {
          const { name, detail } = event.data;
          if (name === "safepay-inframe__ready") {
            setIsReady(true);
          }
          if (
            name === "safepay-inframe__messages-processed" &&
            messagesProcessedCallback.current
          ) {
            messagesProcessedCallback.current();
          }
          onInframeEvent(name, detail);
        }
      };

      window.addEventListener("message", messageHandler);
      return () => window.removeEventListener("message", messageHandler);
    }, []);

    // Queues a method call to be sent to the iframe
    const queueMethodCall = (methodName: string, ...args: any[]) => {
      functionQueue(() =>
        ((methodName, ...args) => {
          postMessage(
            {
              type: "safepay-method-call",
              method: methodName,
              args: args,
            },
            "*",
          );
        })(methodName, ...args),
      );
    };

    // Exposes the `queueMethodCall` method to parent components via `ref`
    useImperativeHandle(
      ref,
      () => ({
        queueMethodCall,
      }),
      [],
    );

    useEffect(() => {
      // Handles iframe visibility and properties update
      if (isReady) {
        if (inframeProps) {
          iframeRef.current.contentWindow.postMessage(
            { type: "safepay-property-update", properties: inframeProps },
            "*",
          );
          messagesProcessedCallback.current = () => setIsVisible(true);
        } else {
          setIsVisible(true);
        }
      }
    }, [inframeProps, isReady]);

    return (
      <iframe
        ref={iframeRef}
        className={"safepay-drops-iframe"}
        src={src}
        title={title}
        style={isVisible ? undefined : { visibility: "hidden" }}
        height="100%"
        width="100%"
      />   
    );
  },
);

loadSeamlessIframeStylesAndJsChunks();

export default InframeComponent;
