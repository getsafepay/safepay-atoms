import { useState, useRef, useEffect } from 'react';

/**
 * A custom React hook that manages a queue of functions to be executed sequentially.
 * Once a function is added to the queue, it is executed at the next component re-render.
 * This hook is particularly useful for ensuring that functions are executed in a specific
 * order and that they are not called more often than necessary, such as in response to rapid state changes.
 *
 * @returns {Function} A function that can be used to enqueue a new callback function into the queue.
 * The enqueued functions are executed in the order they were added.
 *
 * @example
 * const enqueueFunction = useFunctionQueue();
 *
 * enqueueFunction(() => {
 *   console.log('This is the first function to execute.');
 * });
 *
 * enqueueFunction(() => {
 *   console.log('This is the second function, executed after the first one.');
 * });
 */
const useFunctionQueue = (): ((callback: Function) => void) => {
  const [state, setState] = useState<Record<string, unknown>>({});
  const queueRef = useRef<Function[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    queueRef.current.forEach((callback) => callback());
    queueRef.current = [];
    isProcessingRef.current = false;
  }, [state]);

  const enqueueFunction = (callback: Function) => {
    queueRef.current.push(callback);
    if (!isProcessingRef.current) {
      setState({});
      isProcessingRef.current = true;
    }
  };

  return enqueueFunction;
};

export default useFunctionQueue;
