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
<script src="https://unpkg.com/@sfpy/atoms@latest/dist/components/index.global.js"></script>
```

## Web Components

### CardCaptureAtom

The `<safepay-card-atom>` component provides card capture functionality.

```html
<safepay-card-atom
  environment="sandbox"
  auth-token="your-auth-token"
  tracker="your-tracker"
></safepay-card-atom>
```

#### Available Props / Attributes

| Attribute                           | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | `'development' | 'production' | 'sandbox' | 'local'` (string) | Environment setting |
| authToken                          | string    | Authentication token for the session     |
| tracker                            | string    | Tracking identifier                      |
| validationEvent                    | 'submit' \| 'change' \| 'keydown' \| 'none' (string) | Determines when card inputs are validated (defaults to 'submit') |
| onError                            | function  | Error callback handler                   |
| onValidated                        | function  | Validation success callback             |
| onProceedToAuthentication          | function  | Authentication proceed callback         |

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
| `fetchValidity()`| Checks if the current card input is valid | `boolean` | `const isValid = cardAtom.fetchValidity()` |
| `clear()`      | Clears all input fields                     | `void`    | `cardAtom.clear()`                         |

#### Example Usage

```javascript
// Example using Web Component methods
const cardAtom = document.querySelector('safepay-card-atom');

// Submit the form
cardAtom.submit();

// Validate the input
cardAtom.validate();

// Check if input is valid
const isValid = cardAtom.fetchValidity();
isValid.then((isValid) => {
  console.log(isValid);
  cardAtom.submit();
});
// Clear the form
cardAtom.clear();
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
  // Set DiscountBody as a property (object), not a string
  const el = document.querySelector('safepay-payer-authentication');
  el.discountBody = { dry_run: true, promo_discount: { code: 'SAVE10' } };
</script>
```

#### Available Props / Attributes

| Attribute                           | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | `'development' | 'production' | 'sandbox' | 'local'` (string) | Environment setting |
| tracker                            | string    | Tracking identifier                       |
| authToken                          | string    | Authentication token                     |
| billing                            | object    | Billing information                      |
| deviceDataCollectionJWT            | string    | Device data collection JWT              |
| deviceDataCollectionURL            | string    | Device data collection URL              |
| discountBody                       | DiscountBody | Optional discount context object sent to Safepay to evaluate/apply discounts during authentication. Set via property (not attribute). |
| onPayerAuthenticationFailure       | function  | Authentication failure callback         |
| onPayerAuthenticationSuccess       | function  | Authentication success callback         |
| onSafepayError                     | function  | Error handling callback                 |

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
        validationEvent="change" // Use 'submit' | 'change' | 'keydown' | 'none'
        imperativeRef={cardRef}
        // Optional callbacks:
        // onValidated={() => console.log('Card validated')}
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
| onProceedToAuthentication     | (data: any) => void           | Callback when ready to proceed to authentication        |          |
| onValidated                   | () => void                   | Callback on successful validation                       |          |
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
        discountBody={{ dry_run: true, promo_discount: { code: 'SAVE10' } }}
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
| billing                          | Billing                         | Billing information (optional)                    |          |
| authorizationOptions             | { do_capture?: boolean; do_card_on_file?: boolean; } | Authorization configuration options |          |
| onPayerAuthenticationFailure     | (data: PayerAuthErrorData) => void | Callback on authentication failure             |          |
| onPayerAuthenticationSuccess     | (data: PayerAuthSuccessData) => void | Callback on authentication success             |          |
| onPayerAuthenticationRequired    | (data: PayerAuthData) => void    | Callback when authentication is required         |          |

## Discount Body

When using Payer Authentication, you can include a discount context via `discountBody`. Pass this as an object (do not stringify) in both Web Component (set via property) and React usages.

Type definition:

```ts
export type DiscountBody =
  | { dry_run: boolean; flat_discount: { discount_id: string } }
  | { dry_run: boolean; promo_discount: { code: string } }
  | { dry_run: boolean; bin_discount: { cardscheme_id: string; bin: string } };
```

Examples:

- Web Component property: `el.discountBody = { dry_run: true, promo_discount: { code: 'SAVE10' } }`
- React prop: `discountBody={{ dry_run: true, flat_discount: { discount_id: 'disc_123' } }}`
- BIN discount (React): `discountBody={{ dry_run: false, bin_discount: { cardscheme_id: 'visa', bin: '411111' } }}`

Notes:
- dry_run: Use `true` to evaluate and surface discount details without committing application; set `false` to apply when supported by your flow.
| onPayerAuthenticationFrictionless| (data: PayerAuthData) => void    | Callback when authentication is frictionless     |          |
| onPayerAuthenticationUnavailable | (data: PayerAuthData) => void    | Callback when authentication is unavailable      |          |
| onSafepayError                   | (data: SafepayError) => void     | General error handling callback                  |          |
| imperativeRef                    | React.MutableRefObject<any>     | Ref to control the component imperatively         | ✅ |


Note: In React usage, you can pass either the `Environment` enum (recommended) or a string value such as `"SANDBOX"` or `"sandbox"`. String values are mapped case-insensitively to the corresponding enum value. If the value is invalid, an exception is thrown to surface the misconfiguration.


## Project Structure

```
.
├── README.md
├── examples
│   ├── card-links-demo.html
│   └── device-metrics-demo.html
├── package-lock.json
├── package.json
├── postcss.config.js
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
