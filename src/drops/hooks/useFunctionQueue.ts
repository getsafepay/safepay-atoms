import { useState, useRef, useEffect } from "react";

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
