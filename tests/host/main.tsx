import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CardCapture, PayerAuthentication } from '../../src/atoms';

type AtomCallbacks = {
  proceedToAuthentication: unknown | null;
  success: unknown | null;
  failure: unknown | null;
  frictionless: unknown | null;
  unavailable: unknown | null;
};

declare global {
  interface Window {
    __atomsCallbacks: AtomCallbacks;
    __reactHostReady: boolean;
    __reactHost: {
      setCardProps: (props: Record<string, unknown>) => void;
      setPayerAuthProps: (props: Record<string, unknown>) => void;
      submitCard: () => void;
    };
  }
}

function App() {
  const cardRef = useRef<any>(null);
  const payerAuthRef = useRef<any>(null);
  const [cardProps, setCardProps] = useState<Record<string, any>>({});
  const [payerAuthProps, setPayerAuthProps] = useState<Record<string, any>>({});
  const [showModal, setShowModal] = useState(false);
  const [ddcData, setDdcData] = useState<{ accessToken: string; deviceDataCollectionURL: string } | null>(null);

  const submitCard = useCallback(() => cardRef.current?.submit(), []);

  useEffect(() => {
    window.__atomsCallbacks = {
      proceedToAuthentication: null,
      success: null,
      failure: null,
      frictionless: null,
      unavailable: null,
    };
    window.__reactHost = {
      setCardProps: (props) => setCardProps((prev) => ({ ...prev, ...props })),
      setPayerAuthProps: (props) => setPayerAuthProps((prev) => ({ ...prev, ...props })),
      submitCard,
    };
    window.__reactHostReady = true;
  }, [submitCard]);

  const hasCard = Boolean(cardProps.authToken && cardProps.tracker);
  const hasPayerAuth = Boolean(payerAuthProps.authToken && payerAuthProps.tracker);

  return (
    <>
      <div style={{ width: '22.5rem', height: '2.6rem' }}>
        {hasCard && (
          <CardCapture
            environment={cardProps.environment ?? 'sandbox'}
            authToken={cardProps.authToken}
            tracker={cardProps.tracker}
            validationEvent="submit"
            imperativeRef={cardRef}
            onProceedToAuthentication={(data) => {
              setDdcData(data);
              setShowModal(true);
              window.__atomsCallbacks.proceedToAuthentication = data;
            }}
          />
        )}
      </div>
      <div id="threeds-modal" className={showModal ? 'modal-backdrop show' : 'hide'}>
        <div className="popup">
          {hasPayerAuth && (
            <PayerAuthentication
              environment={payerAuthProps.environment ?? 'sandbox'}
              authToken={payerAuthProps.authToken}
              tracker={payerAuthProps.tracker}
              user={payerAuthProps.user ?? ''}
              deviceDataCollectionJWT={ddcData?.accessToken ?? ''}
              deviceDataCollectionURL={ddcData?.deviceDataCollectionURL ?? ''}
              imperativeRef={payerAuthRef}
              onPayerAuthenticationSuccess={(data) => {
                setShowModal(false);
                window.__atomsCallbacks.success = data;
              }}
              onPayerAuthenticationFailure={(data) => {
                setShowModal(false);
                window.__atomsCallbacks.failure = data;
              }}
              onPayerAuthenticationFrictionless={(data) => {
                window.__atomsCallbacks.frictionless = data;
              }}
              onPayerAuthenticationUnavailable={(data) => {
                window.__atomsCallbacks.unavailable = data;
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
