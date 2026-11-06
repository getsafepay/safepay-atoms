# Safepay Atoms

Safepay Atoms is a modular library that provides secure payment components for web applications. It includes both Web Components and React components for card capture and payer authentication, enabling seamless integration of Safepay's payment functionality into your applications.

## Installation

### Using npm
```bash
npm install @sfpy/atoms
```

### Using yarn
```bash
yarn add @sfpy/atoms
```

### Using CDN
```html
<script src="https://cdn.jsdelivr.net/npm/@sfpy/atoms@latest/dist/components/index.global.js"></script>
```

## Web Components

### CardCaptureAtom

The `<safepay-card-atom>` component provides card capture functionality. Set its configuration through the element's properties:

```html
<safepay-card-atom id="card-atom"></safepay-card-atom>
<script type="module">
  const cardAtom = document.getElementById('card-atom');
  cardAtom.environment = 'sandbox';
  cardAtom.authToken = 'your-auth-token';
  cardAtom.tracker = 'your-tracker';
  cardAtom.inputStyle = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16px',
    color: '#111827',
  };
</script>
```

#### Available Attributes (HTML)

Use attributes for string values only. Attributes are always strings and are mapped to properties internally.

| Attribute                           | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | `'development' \| 'production' \| 'sandbox' \| 'local'` (string) | Environment setting |
| authToken                          | string    | Authentication token for the session     |
| tracker                            | string    | Tracking identifier                      |
| validationEvent                    | 'submit' \| 'change' \| 'keydown' \| 'none' (string) | Determines when card inputs are validated (defaults to 'submit') |

#### Available Properties (JS)

Set properties directly on the element for functions, objects, and non-string values.

| Property                            | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | `'development' \| 'production' \| 'sandbox' \| 'local'` (string) | Environment setting |
| authToken                          | string    | Authentication token for the session     |
| tracker                            | string    | Tracking identifier                      |
| validationEvent                    | 'submit' \| 'change' \| 'keydown' \| 'none' (string) | Determines when card inputs are validated (defaults to 'submit') |
| inputStyle                         | InputStyle | Inline styles forwarded to the secure iframe inputs |
| promoCode                          | string    | Optional promo code to auto-apply on load (case-insensitive). See [Discounts](#discounts). |
| forcePromoCode                     | boolean   | When `true` and `promoCode` is set, card scheme (BIN) discounts are skipped, so the promo code is always the discount used. See [Forcing a promo code](#forcing-a-promo-code-forcepromocode). |
| onReady                             | function  | Callback when the embedded iframe signals it is ready |
| onError                            | function  | Error callback handler                   |
| onValidated                        | `(data: { bin: string; lastFour: string; cardType?: string }) => void` | Called when the card passes client-side validation. Receives the first 6 digits (`bin`), last 4 digits (`lastFour`), and the detected card type (`cardType`, e.g. `"visa"`). |
| onDiscountApplied                  | `(data: { appliedDiscount, discountBody }) => void` | Called each time a discount is previewed. Forward `discountBody` to payer authentication. See [Discounts](#discounts). |
| onProceedToAuthentication          | function  | Authentication proceed callback         |
| imperativeRef                      | CardCaptureImperativeRef | Ref object for imperative methods (optional) |

#### Setting Properties vs Attributes

Attributes are string-only. For callbacks and objects, set properties directly:

```html
<safepay-card-atom id="card-atom" environment="sandbox"></safepay-card-atom>
<script type="module">
  const cardAtom = document.getElementById('card-atom');
  cardAtom.onReady = () => console.log('ready');
  cardAtom.onValidated = ({ bin, lastFour, cardType }) => console.log('validated', bin, lastFour, cardType);
  cardAtom.onProceedToAuthentication = (data) => console.log('auth', data);
</script>
```

> `inputStyle` is exposed as a JavaScript property on the custom element. It is not intended to be passed as an HTML attribute string.

### CardCaptureAtom Methods

The `<safepay-card-atom>` component exposes several methods that can be called imperatively:

```javascript
// Get reference to the element
const cardAtom = document.querySelector('safepay-card-atom');
```

| Method         | Description                                 | Returns   | Example                                    |
|----------------|---------------------------------------------|-----------|---------------------------------------------|
| `submit()`     | Triggers the submission of the card data    | `void`    | `cardAtom.submit()`                        |
| `validate()`   | Performs validation of the current card input| `void`    | `cardAtom.validate()`                      |
| `fetchValidity()`| Checks if the current card input is valid | `Promise<boolean>` | `const isValid = await cardAtom.fetchValidity()` |
| `clear()`      | Clears all input fields                     | `void`    | `cardAtom.clear()`                         |

#### Example Usage

```javascript
// Example using Web Component methods
const cardAtom = document.querySelector('safepay-card-atom');

// Submit the form
cardAtom.submit();

// Validate the input
cardAtom.validate();

// Check if input is valid (fetchValidity returns a Promise)
cardAtom.fetchValidity().then((isValid) => {
  console.log(isValid);
  if (isValid) cardAtom.submit();
});
// Clear the form
cardAtom.clear();
```

#### Using Web Components

For a full plain HTML/JavaScript integration (no bundler required), see `examples/card-links-demo.html`. The snippet below mirrors that example so you can copy it into your own demo page:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Safepay Card Capture Demo</title>
    <script src="https://unpkg.com/@sfpy/atoms@latest/dist/components/index.global.js"></script>
    <style>
      .card-frame {
        width: 22.5rem;
        height: 2.6rem;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        display: none;
        background-color: rgba(0, 0, 0, 0.5);
        cursor: pointer;
      }
      .modal-backdrop.show {
        display: block;
      }
      .popup {
        position: absolute;
        top: 12.5%;
        left: 25%;
        width: 40%;
        height: 75%;
        border: 1px solid black;
        background-color: white;
      }
    </style>
  </head>
  <body>
    <h1>Card Capture Atom</h1>
    <div class="card-frame">
      <safepay-card-atom></safepay-card-atom>
    </div>
    <button type="button" onclick="handleSubmit()">Submit</button>
    <div id="threeds-modal" class="modal-backdrop">
      <div class="popup">
        <safepay-payer-auth-atom></safepay-payer-auth-atom>
      </div>
    </div>

    <script type="text/javascript">
      const ENVIRONMENT = 'sandbox';
      const TRACKER = 'track_your_tracker_id';
      const CLIENT_SECRET = 'your_auth_token';

      const cardAtom = document.querySelector('safepay-card-atom');
      const payerAuthAtom = document.querySelector('safepay-payer-auth-atom');
      const modal = document.getElementById('threeds-modal');

      function closeModal() {
        modal.classList.remove('show');
      }

      function openModal() {
        modal.classList.add('show');
      }

      Object.assign(payerAuthAtom, {
        environment: ENVIRONMENT,
        tracker: TRACKER,
        authToken: CLIENT_SECRET,
        authorizationOptions: {
          do_capture: true,
          do_card_on_file: true,
        },
        onPayerAuthenticationFailure: closeModal,
        onPayerAuthenticationSuccess: closeModal,
        onPayerAuthenticationFrictionless: closeModal,
        onPayerAuthenticationUnavailable: closeModal,
        onSafepayError: (error) => {
          console.error('Safepay error', error);
          closeModal();
        },
      });

      Object.assign(cardAtom, {
        environment: ENVIRONMENT,
        tracker: TRACKER,
        authToken: CLIENT_SECRET,
        validationEvent: 'submit',
        onError: (error) => console.error(error),
        onValidated: () => console.log('validated'),
        onDiscountApplied: (data) => {
          if (data && data.discountBody) {
            payerAuthAtom.discountBody = data.discountBody;
          }
        },
        onProceedToAuthentication: (data) => {
          payerAuthAtom.deviceDataCollectionJWT = data.accessToken;
          payerAuthAtom.deviceDataCollectionURL = data.deviceDataCollectionURL;
          openModal();
        },
      });

      function handleSubmit() {
        cardAtom.fetchValidity().then((isValid) => {
          if (isValid) {
            cardAtom.submit();
          }
        });
      }

      window.handleSubmit = handleSubmit;
    </script>
  </body>
</html>
```

### PayerAuthenticationAtom

The `<safepay-payer-authentication>` component handles payer authentication flows.

```html
<safepay-payer-authentication
  environment="sandbox"
  auth-token="your-auth-token"
  tracker="your-tracker"
></safepay-payer-authentication>

<script>
  // Set object properties directly on the element.
  const el = document.querySelector('safepay-payer-authentication');
  el.billing = {
    street_1: '123 Main Street',
    street_2: 'Suite 500',
    city: 'Berlin',
    state: 'BE',
    country: 'DE',
    postal_code: '10115',
  };
  el.discountBody = {
    dry_run: true,
    bin_discount: { cardscheme_id: 'visa', bin: '411111' },
  };
</script>
```

#### Available Attributes (HTML)

Use attributes for string values only. Attributes are always strings and are mapped to properties internally.

| Attribute                           | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | `'development' \| 'production' \| 'sandbox' \| 'local'` (string) | Environment setting |
| tracker                            | string    | Tracking identifier                       |
| authToken                          | string    | Authentication token                     |
| user                               | string    | User identifier forwarded with authentication requests |
| deviceDataCollectionJWT            | string    | Device data collection JWT              |
| deviceDataCollectionURL            | string    | Device data collection URL              |

#### Available Properties (JS)

Set properties directly on the element for functions, objects, and non-string values.

| Property                            | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | `'development' \| 'production' \| 'sandbox' \| 'local'` (string) | Environment setting |
| tracker                            | string    | Tracking identifier                       |
| authToken                          | string    | Authentication token                     |
| user                               | string    | User identifier forwarded with authentication requests |
| billing                            | Billing   | Billing information                      |
| deviceDataCollectionJWT            | string    | Device data collection JWT              |
| deviceDataCollectionURL            | string    | Device data collection URL              |
| discountBody                       | DiscountBody | Optional discount context object sent to Safepay to evaluate/apply discounts during authentication. Set via property (not attribute). |
| authorizationOptions               | AuthorizationOptions | Authorization configuration options       |
| onPayerAuthenticationFailure       | function  | Recommended. Called after a challenge-based 3DS flow fails. The user may already have seen the challenge UI. |
| onPayerAuthenticationSuccess       | function  | Recommended. Called after a challenge-based 3DS flow succeeds. This does not run for frictionless auth. |
| onPayerAuthenticationRequired      | function  | Optional. Called when enrollment determines that a step-up 3DS challenge is required. Informational only; the challenge UI may start rendering immediately after this event. |
| onPayerAuthenticationFrictionless  | function  | Recommended. Called when authentication completes without a 3DS challenge and authorization succeeds. This is the success callback for the frictionless path. |
| onPayerAuthenticationUnavailable   | function  | Recommended. Called when the payer-auth flow cannot continue before a successful challenge flow is reached, such as enrollment/setup failures or other pre-challenge terminal errors. |
| onSafepayError                     | function  | Recommended. Called for general Safepay iframe/application errors outside the normal authentication lifecycle. |
| imperativeRef                      | PayerAuthenticationImperativeRef | Ref object for imperative methods (optional) |

#### Callback Semantics

The payer authentication callbacks represent different stages of the flow. They are not interchangeable:

- `onPayerAuthenticationRequired` means Safepay has finished enrollment and determined that a 3DS challenge is needed. Use it for analytics or UI state if you want to know that a challenge is about to happen. It is not a completion callback, and the internal challenge iframe may begin rendering right away.
- `onPayerAuthenticationFrictionless` means authentication succeeded without showing a challenge to the user. This is the terminal success callback for the frictionless path.
- `onPayerAuthenticationSuccess` means the challenge-based 3DS flow completed successfully after the user entered the challenge flow. It does not run for frictionless auth.
- `onPayerAuthenticationFailure` means the challenge-based 3DS flow failed after the user had already entered the challenge flow.
- `onPayerAuthenticationUnavailable` means the flow failed before Safepay could complete a successful challenge flow. In practice, this covers enrollment/setup failures and other pre-challenge terminal states.
- `onSafepayError` is the catch-all error callback for general iframe/application errors that do not fit the normal authentication lifecycle.

In most integrations, the recommended callback set is:

- `onPayerAuthenticationFrictionless`
- `onPayerAuthenticationSuccess`
- `onPayerAuthenticationFailure`
- `onPayerAuthenticationUnavailable`
- `onSafepayError`

These cover the terminal success and failure states you usually need to close modals, update UI, or continue checkout. `onPayerAuthenticationRequired` is usually optional and best treated as an informational/analytics hook.

#### Setting Properties vs Attributes

Attributes are string-only. For callbacks and objects, set properties directly:

```html
<safepay-payer-authentication id="payer-auth" environment="sandbox"></safepay-payer-authentication>
<script type="module">
  const payerAuth = document.getElementById('payer-auth');
  payerAuth.billing = {
    street_1: '123 Main Street',
    street_2: 'Suite 500',
    city: 'Berlin',
    state: 'BE',
    country: 'DE',
    postal_code: '10115',
  };
  payerAuth.authorizationOptions = { do_capture: true };
  payerAuth.onPayerAuthenticationSuccess = (data) => console.log('success', data);
</script>
```

## React Components

### Using Styles
The Safepay Atoms library includes pre-built CSS styles that you can import into your project. These styles are bundled into a single file for convenience.

### Importing Styles
To use the styles in your project, import the bundled CSS file:

```jsx
// Import the styles in your JavaScript/TypeScript project
import '@sfpy/atoms/styles'
```

### CardCapture

```jsx
import { Suspense, useRef } from 'react';
import { CardCapture, Environment } from '@sfpy/atoms';

function PaymentForm() {
  const cardRef = useRef(null);

  return (
    <Suspense fallback={<div>Loading card capture...</div>}>
      <CardCapture
        environment={Environment.Sandbox}
        authToken="your-auth-token"
        tracker="your-tracker"
        validationEvent="change" // Use `submit` | `change` | `keydown` | `none`
        inputStyle={{
          fontFamily: '"Courier New", ui-monospace, monospace',
          fontSize: '18px',
          color: '#111827',
        }}
        imperativeRef={cardRef}
        // Optional callbacks:
        // onReady={() => console.log('Card iframe ready')}
        // onValidated={(data) => console.log('Card validated', data.bin, data.lastFour, data.cardType)}
        // onDiscountApplied={(data) => console.log('Discount applied', data)}
        // onProceedToAuthentication={(data) => console.log('Proceed to auth', data)}
        // onError={(error) => console.error('Error', error)}
      />
    </Suspense>
  );
}

```

#### Available Props

| Prop                          | Type                         | Description                                             | Required |
|-------------------------------|-------------------------------|---------------------------------------------------------|:--------:|
| environment                   | `Environment` or case-insensitive string (`'development'`, `'production'`, `'sandbox'`, `'local'`) | Environment setting | ✅ |
| authToken                     | string                       | Authentication token                                    | ✅ |
| tracker                       | string                       | Tracking identifier                                     | ✅ |
| validationEvent               | 'submit' \| 'change' \| 'keydown' \| 'none' | Choose when validation runs (defaults to `submit`) | ✅ |
| inputStyle                    | React.CSSProperties          | Inline styles forwarded to the secure iframe inputs     |    |
| promoCode                     | string                       | Optional promo code to auto-apply on load (case-insensitive). See [Discounts](#discounts). |          |
| forcePromoCode                | boolean                      | When `true` and `promoCode` is set, card scheme (BIN) discounts are skipped, so the promo code is always the discount used. See [Forcing a promo code](#forcing-a-promo-code-forcepromocode). |          |
| onReady                       | () => void                   | Callback when the embedded iframe signals it is ready   |          |
| onProceedToAuthentication     | (data: any) => void           | Callback when ready to proceed to authentication        |          |
| onValidated                   | `(data: CardValidatedData) => void` | Called when the card passes client-side validation. Receives `{ bin, lastFour, cardType? }`. |          |
| onDiscountApplied             | `(data: { appliedDiscount, discountBody }) => void` | Called each time a discount is previewed. Forward `discountBody` to `PayerAuthentication`. See [Discounts](#discounts). |          |
| onError                       | (error: string) => void       | Error handling callback                                |          |
| imperativeRef                 | React.MutableRefObject<any>  | Ref to control the component imperatively               | ✅ |

### CardCapture Imperative Methods

The CardCapture component can be controlled using a ref. These methods are accessed through the `imperativeRef` prop:

```typescript
// Define the ref
const cardRef = useRef<{
  submit: () => void;
  validate: () => void;
  fetchValidity: () => Promise<boolean>;
  clear: () => void;
}>(null);
```
| Method           | Description                                | Returns          | Example                                         |
|------------------|--------------------------------------------|-----------------|-------------------------------------------------|
| `submit()`       | Submits the card data for processing       | `void`          | `cardRef.current?.submit()`                     |
| `validate()`     | Triggers validation of the current input   | `void`          | `cardRef.current?.validate()`                   |
| `fetchValidity()`| Asynchronously checks input validity       | `Promise<boolean>` | `const isValid = await cardRef.current?.fetchValidity()` |
| `clear()`        | Resets all input fields                    | `void`          | `cardRef.current?.clear()`                      |

#### Example Usage

```jsx
import React, { useRef } from 'react';
import { CardCapture } from '@sfpy/atoms';

function PaymentForm() {
  const cardRef = useRef(null);

  const handleSubmit = async () => {
    // Submit the form
    cardRef.current?.submit();
  };

  const validateCard = async () => {
    // Validate the input
    cardRef.current?.validate();

    // Check validity
    const isValid = await cardRef.current?.fetchValidity();
    console.log('Is card valid:', isValid);
  };

  const resetForm = () => {
    // Clear all inputs
    cardRef.current?.clear();
  };

  return (
    <CardCapture
      imperativeRef={cardRef}
      environment="sandbox"
      authToken="your-auth-token"
      // ... other props
    />
  );
}
```

### PayerAuthentication

```jsx
import { Suspense, useRef } from 'react';
import { PayerAuthentication, Environment } from '@sfpy/atoms';

const billing = {
  street_1: '123 Main Street',
  street_2: 'Suite 500',
  city: 'Berlin',
  state: 'BE',
  country: 'DE',
  postal_code: '10115',
};

function AuthenticationForm() {
  const authRef = useRef(null);

  return (
    <Suspense fallback={<div>Loading authentication...</div>}>
      <PayerAuthentication
        environment={Environment.Sandbox}
        tracker="your-tracker"
        authToken="your-auth-token"
        deviceDataCollectionJWT="your-device-jwt"
        deviceDataCollectionURL="https://your-collection-url"
        billing={billing}
        discountBody={{ dry_run: true, bin_discount: { cardscheme_id: 'visa', bin: '411111' } }}
        imperativeRef={authRef}
        // Optional callbacks you can pass if needed:
        // onPayerAuthenticationSuccess={(data) => console.log('Success', data)}
        // onPayerAuthenticationFailure={(error) => console.log('Failure', error)}
        // onSafepayError={(error) => console.error('Safepay Error', error)}
      />
    </Suspense>
  );
}
```

#### Available Props

| Prop                             | Type                            | Description                                       | Required |
|----------------------------------|---------------------------------|---------------------------------------------------|:--------:|
| environment                      | `Environment` or case-insensitive string (`'development'`, `'production'`, `'sandbox'`, `'local'`) | Environment setting   | ✅ |
| tracker                          | string                          | Tracking identifier                               | ✅ |
| authToken                        | string                          | Authentication token                              | ✅ |
| deviceDataCollectionJWT          | string                          | Device data collection JWT                        | ✅ |
| deviceDataCollectionURL          | string                          | Device data collection endpoint URL               | ✅ |
| discountBody                     | DiscountBody                    | Optional discount context object sent to Safepay to evaluate/apply discounts during authentication |          |
| user                             | string                          | User identifier forwarded with authentication requests |          |
| billing                          | Billing                         | Billing information (optional)                    |          |
| authorizationOptions             | AuthorizationOptions            | Authorization configuration options |          |
| onPayerAuthenticationFailure     | (data: PayerAuthErrorData) => void | Recommended. Called after a challenge-based 3DS flow fails. The user may already have seen the challenge UI. |          |
| onPayerAuthenticationSuccess     | (data: PayerAuthSuccessData) => void | Recommended. Called after a challenge-based 3DS flow succeeds. This does not run for frictionless auth. |          |
| onPayerAuthenticationRequired    | (data: PayerAuthData) => void    | Optional. Called when enrollment determines that a step-up 3DS challenge is required. Informational only; the challenge UI may start rendering immediately after this event. |          |
| onPayerAuthenticationFrictionless| (data: PayerAuthData) => void    | Recommended. Called when authentication completes without a challenge and authorization succeeds. This is the success callback for the frictionless path. |          |
| onPayerAuthenticationUnavailable | (data: PayerAuthData) => void    | Recommended. Called when the payer-auth flow cannot continue before a successful challenge flow is reached, such as enrollment/setup failures or other pre-challenge terminal errors. |          |
| onSafepayError                   | (data: SafepayError) => void     | Recommended. Called for general Safepay iframe/application errors outside the normal authentication lifecycle. |          |
| imperativeRef                    | React.MutableRefObject<any>     | Ref to control the component imperatively         | ✅ |

### Combined Card + Authentication Flow

The example below mirrors the stripped-down integration used in `app/routes/combinedDemoStripped.tsx` from the test app. It shows how to:

- render `CardCapture` and `PayerAuthentication` together
- pass `inputStyle` into the secure card iframe
- wait for card validation before submitting
- open the authentication modal only when Safepay requests it
- forward `discountBody` from card capture into payer authentication

```jsx
import { CardCapture, Environment, PayerAuthentication } from '@sfpy/atoms';
import '@sfpy/atoms/styles';
import * as React from 'react';

const DEMO_ENVIRONMENT = Environment.Development;
const DEMO_AUTH_TOKEN = 'your-auth-token';
const DEMO_TRACKER = 'your-tracker';

const CARD_INPUT_STYLE = {
  fontFamily: '"Courier New", ui-monospace, monospace',
  fontSize: '18px',
  color: '#111827',
};

const CARD_FRAME_STYLE = {
  width: '22.5rem',
  height: '2.6rem',
};

const MODAL_BACKDROP_STYLE = {
  position: 'fixed',
  width: '100%',
  height: '100%',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 2,
  cursor: 'pointer',
};

const POPUP_STYLE = {
  position: 'absolute',
  top: '12.5%',
  left: '25%',
  width: '40%',
  height: '75%',
  border: '1px solid black',
  backgroundColor: 'white',
  zIndex: 2,
};

const MODAL_CONTENT_STYLE = {
  width: '100%',
  height: '100%',
};

type PayerAuthSession = {
  accessToken: string;
  deviceDataCollectionURL: string;
};

type DiscountBody = {
  dry_run: boolean;
  bin_discount?: { cardscheme_id: string; bin: string };
  promo_discount?: { code: string };
};

const BILLING = {
  street_1: '123 Main Street',
  street_2: 'Suite 500',
  city: 'Berlin',
  state: 'BE',
  country: 'DE',
  postal_code: '10115',
};

export default function CombinedDemo() {
  const cardRef = React.useRef(null);
  const payerAuthRef = React.useRef(null);

  // Keep payer-auth session details only after Safepay asks us to continue into 3DS.
  const [payerAuthSession, setPayerAuthSession] = React.useState<PayerAuthSession | null>(null);

  // If card capture returns discount context, forward it into payer authentication.
  const [discountBody, setDiscountBody] = React.useState<DiscountBody | undefined>();

  const closeModal = React.useCallback(() => {
    setPayerAuthSession(null);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    // Trigger validation first so the iframe can surface any field errors.
    cardRef.current?.validate();

    // Then ask the iframe whether the current input is valid.
    const isValid = await cardRef.current?.fetchValidity();

    if (isValid) {
      // Only submit once the secure iframe confirms the input is valid.
      await cardRef.current?.submit();
    }
  }, []);

  return (
    <main style={{ padding: '24px' }}>
      <div style={CARD_FRAME_STYLE}>
        <CardCapture
          environment={DEMO_ENVIRONMENT}
          authToken={DEMO_AUTH_TOKEN}
          tracker={DEMO_TRACKER}
          validationEvent="submit"
          inputStyle={CARD_INPUT_STYLE}
          imperativeRef={cardRef}
          // promoCode="SAVE10"  — optional: auto-applies this promo code once offers load
          onReady={() => console.log('card iframe ready')}
          onError={(error) => console.log(error)}
          onValidated={(data) => console.log('validated', data.bin, data.lastFour, data.cardType)}
          onDiscountApplied={(data) => {
            if (data?.discountBody) {
              setDiscountBody(data.discountBody);
            }
          }}
          onProceedToAuthentication={(data) => {
            // Safepay returns the values needed to initialize payer authentication.
            setPayerAuthSession({
              accessToken: data.accessToken,
              deviceDataCollectionURL: data.deviceDataCollectionURL,
            });
          }}
        />
      </div>

      <button style={{ marginTop: '16px' }} onClick={handleSubmit}>
        Submit
      </button>

      {payerAuthSession ? (
        <div style={MODAL_BACKDROP_STYLE} onClick={closeModal}>
          <div style={POPUP_STYLE} onClick={(event) => event.stopPropagation()}>
            <div style={MODAL_CONTENT_STYLE}>
              <PayerAuthentication
                environment={DEMO_ENVIRONMENT}
                authToken={DEMO_AUTH_TOKEN}
                tracker={DEMO_TRACKER}
                imperativeRef={payerAuthRef}
                deviceDataCollectionJWT={payerAuthSession.accessToken}
                deviceDataCollectionURL={payerAuthSession.deviceDataCollectionURL}
                billing={BILLING}
                discountBody={discountBody}
                authorizationOptions={{
                  do_capture: true,
                  do_card_on_file: true,
                }}
                onPayerAuthenticationFailure={(data) => {
                  console.log('onPayerAuthenticationFailure', data);
                  closeModal();
                }}
                onPayerAuthenticationSuccess={(data) => {
                  console.log('onPayerAuthenticationSuccess', data);
                  closeModal();
                }}
                onPayerAuthenticationFrictionless={(data) => {
                  console.log('onPayerAuthenticationFrictionless', data);
                  closeModal();
                }}
                onPayerAuthenticationUnavailable={(data) => {
                  console.log('onPayerAuthenticationUnavailable', data);
                  closeModal();
                }}
                onSafepayError={(error) => {
                  console.log('onSafepayError', error.error.message);
                  closeModal();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
```

## Discounts

Card capture can apply two kinds of discount to a payment:

| Kind | Configured as | How it's triggered |
|------|---------------|--------------------|
| **Card scheme (BIN) discount** | An offer tied to a list of card BINs (the first 6 digits of a card number) | Automatically, when the shopper has typed at least 6 digits of a card number |
| **Promo code discount** | An offer with a code, such as `SAVE10` | Automatically on load, when you pass `promoCode` to card capture |

You don't calculate or apply anything yourself. Card capture works out which discount applies, previews it with Safepay, and tells you about it through `onDiscountApplied`. You then forward the discount to payer authentication, which applies it to the payment.

### How it works

1. **Offers are loaded.** When card capture loads, it fetches the discount offers available for the tracker's amount and currency. This list includes card scheme offers and promo codes.
2. **A discount is previewed.** When a promo code or card BIN matches an offer, card capture asks Safepay to evaluate it as a dry run (`dry_run: true`). Nothing is charged or committed at this point.
3. **You're notified.** Card capture calls `onDiscountApplied` with:
   - `appliedDiscount`: Safepay's response for the previewed discount, including the discounted amounts.
   - `discountBody`: the `DiscountBody` that identifies the discount.
4. **You forward it.** Pass `discountBody` to payer authentication (the `discountBody` prop or property). Without this step, no discount is applied to the payment.
5. **The discount is applied.** When authentication starts, Safepay applies the discount to the payment. Payer authentication always sends it with `dry_run: false`, whatever `dry_run` value the `discountBody` has.

```js
cardAtom.onDiscountApplied = function (data) {
  if (data && data.discountBody) {
    payerAuthAtom.discountBody = data.discountBody;
  }
};
```

For React, see the `discountBody` state in [Combined Card + Authentication Flow](#combined-card--authentication-flow).

### Which discount wins

Only one discount can apply to a payment. When more than one could apply, card capture decides as follows.

**Several card scheme offers match the same BIN.** The offer whose rule has the highest `value` is used. The comparison uses the raw `value` and doesn't account for the rule type. A 10% offer has a value of `10`, and a fixed offer of 500 has a value of `500`, so the fixed offer wins even when 10% would be worth more. Avoid configuring percentage and fixed-amount offers on the same BINs.

**A promo code and a card scheme discount both match** (without `forcePromoCode`):
- The promo code is applied first, as soon as the offers load.
- When the shopper types a card number with a matching BIN, the card scheme discount **replaces** the promo code. This happens even if the promo code was worth more.
- `onDiscountApplied` is called again with the card scheme `discountBody`. Always forward the most recent one.

**A promo code would replace a discount that's worth more.** This applies when `promoCode` changes after a card scheme discount has been applied. The two are compared by their actual value, taking the percentage or fixed amount and any maximum discount into account. If the new promo code is worth less, it isn't applied, and the current discount stays.

**`forcePromoCode` is set.** See the next section.

### Forcing a promo code (`forcePromoCode`)

Set `forcePromoCode: true` together with `promoCode` when the promo code must always be the discount used, for example in a campaign-specific checkout.

With both set:
- Card scheme (BIN) discounts are skipped entirely. They aren't previewed, and they can't replace the promo code.
- The promo code is applied on load as usual.

`forcePromoCode` has no effect without `promoCode`.

Set both as properties on the element in JavaScript, or as props in React. `forcePromoCode` is a boolean, so set it as a property, not an HTML attribute.

```js
cardAtom.promoCode = 'SAVE10';
cardAtom.forcePromoCode = true;
```

```jsx
<CardCapture promoCode="SAVE10" forcePromoCode /* ...other props */ />
```

### Promo code behaviour

- **Matching is case-insensitive:** `save10` matches an offer with the code `SAVE10`.
- **Changing `promoCode`** after load applies the new code, subject to the value check described in [Which discount wins](#which-discount-wins).
- **No error callback for promo codes.** If the code doesn't match an offer, or is rejected because a better discount is already applied, `onError` isn't called. The only sign is a `[discount]` warning in the browser console from inside the card iframe. Treat a missing `onDiscountApplied` call as "no discount applied", and validate promo codes on your side before showing them to shoppers as accepted.

### Card scheme discount behaviour

- **Evaluated on every card number change.** The BIN is checked whenever the card number changes and has at least 6 digits.
- **No event when a discount is removed.** If the shopper changes to a card whose BIN matches no offer, card capture drops the previewed discount, but `onDiscountApplied` isn't called. A `discountBody` you stored earlier can then still refer to the previous card's BIN. Before forwarding a card scheme `discountBody`, check that its `bin_discount.bin` matches the `bin` from the latest `onValidated` call.

```js
var latestBin;
var pendingDiscountBody;

cardAtom.onValidated = function (data) {
  latestBin = data.bin;
};
cardAtom.onDiscountApplied = function (data) {
  pendingDiscountBody = data && data.discountBody;
};

function startAuthentication() {
  var body = pendingDiscountBody;
  var isStaleBin = body && body.bin_discount && body.bin_discount.bin !== latestBin;
  payerAuthAtom.discountBody = isStaleBin ? undefined : body;
  // ...then set the device data collection values to start authentication
}
```

### Checking which discount was applied

Treat `onDiscountApplied` as a preview for your UI, such as showing the discounted total. The discount is only committed when authentication starts, and the payment can still fail or be declined after that. Confirm the final amount and discount server-side from the payment or tracker, or from the webhook.

## Object Shapes

The following sections show the shapes for the structured values you pass into the atoms.

### InputStyle

Used by `CardCapture` and `<safepay-card-atom>`.

```ts
type InputStyle = Record<string, string | number>;
```

Example:

```ts
const inputStyle = {
  fontFamily: '"Courier New", ui-monospace, monospace',
  fontSize: '18px',
  color: '#111827',
};
```

### Billing

Used by `PayerAuthentication` and `<safepay-payer-authentication>`.
`street_2`, `state`, and `postal_code` are optional.

```ts
type Billing = {
  street_1: string;
  street_2?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
};
```

Example:

```ts
const billing = {
  street_1: '123 Main Street',
  street_2: 'Suite 500',
  city: 'Berlin',
  state: 'BE',
  country: 'DE',
  postal_code: '10115',
};
```

### AuthorizationOptions

Used by `PayerAuthentication` and `<safepay-payer-authentication>`.

```ts
type AuthorizationOptions = {
  do_capture?: boolean;
  do_card_on_file?: boolean;
};
```

Example:

```ts
const authorizationOptions = {
  do_capture: true,
  do_card_on_file: true,
};
```

### DiscountBody

Used by `PayerAuthentication` and `<safepay-payer-authentication>`. Pass this as an object (do not stringify it).

You normally don't build this yourself. Card capture provides it in `onDiscountApplied`, and you forward it unchanged. See [Discounts](#discounts).

```ts
type DiscountBody = {
  dry_run: boolean;
  bin_discount?: {
    cardscheme_id: string;
    bin: string;
  };
  promo_discount?: {
    code: string;
  };
};
```

Examples:

```ts
// Card scheme (BIN) discount, provided when the shopper's card BIN matches an offer
const binDiscountBody = {
  dry_run: true,
  bin_discount: {
    cardscheme_id: 'cs_offer_token', // the matched card scheme offer's token, not a card brand
    bin: '411111',
  },
};

// Promo code discount (applied automatically when a promoCode is passed to CardCapture)
const promoDiscountBody = {
  dry_run: true,
  promo_discount: {
    code: 'SAVE10',
  },
};
```

Notes:
- `bin` is the first 6 digits of the card number, with no spaces.
- `cardscheme_id` is the token of the matched card scheme offer, not a card brand such as `visa`.
- `dry_run` is `true` in bodies from `onDiscountApplied`, because card capture only previews discounts. Payer authentication always sends the body with `dry_run: false`, so the discount is committed when authentication starts.
- `bin_discount` and `promo_discount` are mutually exclusive in a single request.

### CardCaptureImperativeRef

```ts
type CardCaptureImperativeRef = {
  current: null | {
    submit: () => void;
    validate: () => void;
    fetchValidity: () => Promise<boolean>;
    clear: () => void;
  };
};
```

### PayerAuthenticationImperativeRef

```ts
type PayerAuthenticationImperativeRef = {
  current: null | Record<string, never>;
};
```


Note: In React usage, you can pass either the `Environment` enum (recommended) or a string value such as `"SANDBOX"` or `"sandbox"`. String values are mapped case-insensitively to the corresponding enum value. If the value is invalid, an exception is thrown to surface the misconfiguration.

## Development

This repository uses `pnpm` for dependency management.

Install dependencies:
```bash
pnpm install
```

Build the package:
```bash
pnpm run build
```

## Project Structure

```
.
├── README.md
├── examples
│   ├── card-links-demo.html
│   └── device-metrics-demo.html
├── pnpm-lock.yaml
├── package.json
├── postcss.config.cjs
├── src
│   ├── atoms
│   │   ├── CardCaptureIframe
│   │   │   ├── iframe.tsx
│   │   │   └── index.tsx
│   │   ├── PayerAuthenticationIframe
│   │   │   ├── iframe.tsx
│   │   │   ├── index.tsx
│   │   │   └── types.ts
│   │   ├── hooks
│   │   │   ├── index.ts
│   │   │   └── useFunctionQueue.ts
│   │   └── index.ts
│   ├── bridge
│   │   ├── CardAtom.tsx
│   │   ├── PayerAuthentication.tsx
│   │   └── index.tsx
│   ├── elements
│   │   ├── CardCaptureAtom
│   │   │   └── index.ts
│   │   ├── PayerAuthenticationAtom
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── errors.ts
│   ├── index.ts
│   ├── styles
│   │   ├── css
│   │   │   ├── card-link.css
│   │   │   ├── index.css
│   │   │   ├── payer-auth.css
│   │   │   └── seamless-iframe.css
│   │   ├── hooks
│   │   │   ├── index.ts
│   │   │   └── useStyles.ts
│   │   ├── index.css
│   │   ├── index.ts
│   │   └── loaders
│   │       ├── index.ts
│   │       ├── load-all.ts
│   │       ├── load-card-link.ts
│   │       ├── load-index.ts
│   │       ├── load-payer-auth.ts
│   │       └── load-seamless-iframe.ts
│   ├── types
│   │   ├── atoms.ts
│   │   ├── index.ts
│   │   └── safepay.ts
│   ├── utils
│   │   ├── funcs
│   │   │   ├── base64.ts
│   │   │   ├── defineReactiveProperties.ts
│   │   │   ├── generateUUID.ts
│   │   │   ├── isObject.ts
│   │   │   ├── isString.ts
│   │   │   ├── resolveBaseUrl.ts
│   │   │   └── toCamelCase.ts
│   │   └── index.ts
│   └── utils.ts
├── tsconfig.json
├── tsconfig.react.json
└── types
    ├── atoms
    │   ├── index.d.ts
    │   └── models.d.ts
    ├── index.d.ts
    └── models.d.ts
```
