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

const InframeComponent = forwardRef(
  (
    { src, title, inframeProps, onInframeEvent = (e, d) => {} }: InframeProps,
    ref
  ) => {
    const [isReady, setIsReady] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const messagesProcessedCallback = useRef<(() => void) | null>(null);
    const functionQueue = useFunctionQueue();

    useEffect(() => {
      const messageHandler = (event: MessageEvent) => {
        if (
          iframeRef.current &&
          event.source === iframeRef.current.contentWindow &&
          event.data.type === "safepay-inframe-event"
        ) {
          const { name, detail } = event.data;
          if (name === "safepay-inframe__ready") setIsReady(true);
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
    }, [onInframeEvent]);

    const postMessage = (message: any, targetOrigin: string) => {
      iframeRef.current?.contentWindow?.postMessage(message, targetOrigin);
    };

    const queueMethodCall = (methodName: string, ...args: any[]) => {
      functionQueue(() =>
        ((methodName, ...args) => {
          postMessage(
            {
              type: "safepay-method-call",
              method: methodName,
              args: args,
            },
            "*"
          );
        })(methodName, ...args)
      );
    };

    useImperativeHandle(
      ref,
      () => ({
        queueMethodCall,
      }),
      []
    );

    useEffect(() => {
      if (isReady) {
        if (inframeProps) {
          postMessage(
            { type: "safepay-property-update", properties: inframeProps },
            "*"
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
      />
    );
  }
);

loadSeamlessIframeStylesAndJsChunks();

export default InframeComponent;
