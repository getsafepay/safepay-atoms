import * as React from 'react';
import { generateUUID } from '../../utils/funcs/generateUUID';
import useFunctionQueue from '../hooks/useFunctionQueue';

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
const InframeComponent = React.forwardRef(
  ({ src, title, inframeProps, onInframeEvent = (e, d) => {} }: InframeProps, ref) => {
    const ACK_TIMEOUT_MS = 1000;
    const MAX_RETRIES = 2;

    type PendingMessage = {
      payload: any;
      expectAck: boolean;
      retriesLeft: number;
    };

    const [isReady, setIsReady] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const isReadyRef = React.useRef(false);
    const pendingMessagesRef = React.useRef<PendingMessage[]>([]);
    const inflightAcksRef = React.useRef(new Map<string, { timeoutId: number; entry: PendingMessage }>());
    const flushPendingMessagesRef = React.useRef<() => void>(() => {});
    const messagesProcessedCallback = React.useRef<(() => void) | null>(null);
    const functionQueue = useFunctionQueue();

    const dispatchMessage = React.useCallback((entry: PendingMessage) => {
      const target = iframeRef.current?.contentWindow;
      if (!target) {
        pendingMessagesRef.current.push(entry);
        return;
      }

      target.postMessage(entry.payload, '*');

      if (entry.expectAck && entry.payload.messageId) {
        const timeoutId = window.setTimeout(() => {
          inflightAcksRef.current.delete(entry.payload.messageId);
          if (entry.retriesLeft > 0) {
            pendingMessagesRef.current.push({ ...entry, retriesLeft: entry.retriesLeft - 1 });
            flushPendingMessagesRef.current();
          }
        }, ACK_TIMEOUT_MS);
        inflightAcksRef.current.set(entry.payload.messageId, { entry, timeoutId });
      }
    }, []);

    const flushPendingMessages = React.useCallback(() => {
      if (!isReadyRef.current || !iframeRef.current?.contentWindow) return;

      const queued = pendingMessagesRef.current;
      pendingMessagesRef.current = [];
      queued.forEach((entry) => dispatchMessage(entry));
    }, [dispatchMessage]);

    flushPendingMessagesRef.current = flushPendingMessages;

    const enqueueMessage = React.useCallback(
      (message: any, expectAck: boolean = true) => {
        const messageWithId = expectAck ? { ...message, messageId: generateUUID() } : message;
        pendingMessagesRef.current.push({ payload: messageWithId, expectAck, retriesLeft: MAX_RETRIES });

        if (isReadyRef.current) {
          flushPendingMessages();
        }
      },
      [flushPendingMessages]
    );

    React.useEffect(() => {
      // Message event handler for iframe communications
      const messageHandler = (event: MessageEvent) => {
        if (
          iframeRef.current &&
          event.source === iframeRef.current.contentWindow &&
          event.data.type === 'safepay-inframe-event'
        ) {
          const { name, detail } = event.data;
          if (name === 'safepay-inframe__ack') {
            const { messageId, status, detail: ackDetail } = detail || {};
            if (messageId && inflightAcksRef.current.has(messageId)) {
              const inflight = inflightAcksRef.current.get(messageId);
              if (inflight?.timeoutId) window.clearTimeout(inflight.timeoutId);
              inflightAcksRef.current.delete(messageId);
              if (status === 'error') {
                console.warn(
                  `Iframe ack returned error for message ${messageId}: ${ackDetail?.message || 'unknown error'}`
                );
              }
            }
            return;
          }
          if (name === 'safepay-inframe__ready') {
            isReadyRef.current = true;
            setIsReady(true);
            flushPendingMessages();
          }
          if (name === 'safepay-inframe__messages-processed' && messagesProcessedCallback.current) {
            messagesProcessedCallback.current();
          }
          onInframeEvent(name, detail);
        }
      };

      window.addEventListener('message', messageHandler);
      return () => window.removeEventListener('message', messageHandler);
    }, [flushPendingMessages, onInframeEvent]);

    React.useEffect(() => {
      // Reset readiness whenever the iframe source changes
      isReadyRef.current = false;
      setIsReady(false);
      setIsVisible(false);
      pendingMessagesRef.current = [];
      inflightAcksRef.current.forEach(({ timeoutId }) => window.clearTimeout(timeoutId));
      inflightAcksRef.current.clear();
    }, [src]);

    React.useEffect(
      () => () => {
        inflightAcksRef.current.forEach(({ timeoutId }) => window.clearTimeout(timeoutId));
        inflightAcksRef.current.clear();
      },
      []
    );

    // Queues a method call to be sent to the iframe
    const queueMethodCall = (methodName: string, ...args: any[]) => {
      functionQueue(() =>
        ((methodName, ...args) => {
          enqueueMessage({
            type: 'safepay-method-call',
            method: methodName,
            args: args,
          });
        })(methodName, ...args)
      );
    };

    // Exposes the `queueMethodCall` method to parent components via `ref`
    React.useImperativeHandle(
      ref,
      () => ({
        queueMethodCall,
      }),
      []
    );

    React.useEffect(() => {
      // Handles iframe visibility and properties update
      if (isReady) {
        if (inframeProps) {
          enqueueMessage({ type: 'safepay-property-update', properties: inframeProps });
          messagesProcessedCallback.current = () => setIsVisible(true);
        } else {
          setIsVisible(true);
        }
      }
    }, [enqueueMessage, inframeProps, isReady]);

    return (
      <iframe
        ref={iframeRef}
        className={'safepay-atoms-iframe'}
        src={src}
        title={title}
        style={isVisible ? undefined : { visibility: 'hidden' }}
      />
    );
  }
);

//loadSeamlessIframeStylesAndJsChunks();

export default InframeComponent;
