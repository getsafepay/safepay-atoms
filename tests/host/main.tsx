import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CardCapture, PayerAuthentication } from '../../src/atoms';

type PayerAuthCallback = 'success' | 'failure' | 'frictionless' | 'unavailable' | 'timeout' | 'declined';

type AtomCallbacks = Record<PayerAuthCallback, unknown | null> & {
  proceedToAuthentication: unknown | null;
  // Payer auth outcome callbacks in the order they fired.
  calls: PayerAuthCallback[];
};

const record = (name: PayerAuthCallback, data: unknown) => {
  window.__atomsCallbacks[name] = data;
  window.__atomsCallbacks.calls.push(name);
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
      timeout: null,
      declined: null,
      calls: [],
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
                record('success', data);
              }}
              onPayerAuthenticationFailure={(data) => {
                setShowModal(false);
                record('failure', data);
              }}
              onPayerAuthenticationFrictionless={(data) => record('frictionless', data)}
              onPayerAuthenticationUnavailable={(data) => record('unavailable', data)}
              onPayerAuthenticationTimeout={(data) => record('timeout', data)}
              // Set only when the test asks for it: atoms reports a decline
              // differently depending on whether the merchant provided it.
              onPaymentDeclined={
                payerAuthProps.declinedHandler
                  ? (data) => {
                      setShowModal(false);
                      record('declined', data);
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
