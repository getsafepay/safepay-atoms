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
<script src="https://unpkg.com/@sfpy/atoms@latest/dist/index.js"></script>
```

## Initialization

Initialize Safepay in your application:

```javascript
const safepay = Safepay();
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

#### Available Props/Attributes

| Attribute                           | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | string    | Environment setting ('sandbox' or 'production') |
| authToken                          | string    | Authentication token for the session     |
| tracker                            | string    | Tracking identifier                      |
| validationEvent                    | string    | Event that triggers validation          |
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
```

#### Available Props/Attributes

| Attribute                           | Type      | Description                              |
|-------------------------------------|-----------|------------------------------------------|
| environment                         | string    | Environment setting ('sandbox' or 'production') |
| tracker                            | string    | Tracking identifier                       |
| authToken                          | string    | Authentication token                     |
| billing                            | object    | Billing information                      |
| deviceDataCollectionJWT            | string    | Device data collection JWT              |
| deviceDataCollectionURL            | string    | Device data collection URL              |
| onPayerAuthenticationFailure       | function  | Authentication failure callback         |
| onPayerAuthenticationSuccess       | function  | Authentication success callback         |
| onSafepayError                     | function  | Error handling callback                 |

## React Components

### CardCaptureIframe

```jsx
import { Suspense } from 'react';
import { CardCaptureIframe } from '@sfpy/atoms';

function PaymentForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CardCaptureIframe
        environment="sandbox"
        authToken="your-auth-token"
        tracker="your-tracker"
      />
    </Suspense>
  );
}
```

#### Available Props

| Prop                               | Type                  | Description                                    |
|-----------------------------------|----------------------|------------------------------------------------|
| environment                        | string               | Environment setting                            |
| authToken                         | string               | Authentication token                           |
| tracker                           | string               | Tracking identifier                            |
| validationEvent                   | string               | Validation trigger event                       |
| onProceedToAuthentication         | function             | `(accessToken?: string, actionUrl?: string) => void` |
| onProceedToAuthorization         | function             | `() => void`                                   |
| onValidated                       | function             | `() => void`                                   |
| onError                           | function             | `(error: string) => void`                      |
| imperativeRef                     | React.MutableRefObject| Reference for imperative methods              |

### CardCaptureIframe Imperative Methods

The CardCaptureIframe component can be controlled using a ref. These methods are accessed through the `imperativeRef` prop:

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
import { CardCaptureIframe } from '@sfpy/atoms';

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
    <CardCaptureIframe
      imperativeRef={cardRef}
      environment="sandbox"
      authToken="your-auth-token"
      // ... other props
    />
  );
}
```

### PayerAuthenticationIframe

```jsx
import { Suspense } from 'react';
import { PayerAuthenticationIframe } from '@sfpy/atoms';

function AuthenticationForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayerAuthenticationIframe
        environment="sandbox"
        authToken="your-auth-token"
        tracker="your-tracker"
      />
    </Suspense>
  );
}
```

#### Available Props

| Prop                               | Type                  | Description                                    |
|-----------------------------------|----------------------|------------------------------------------------|
| environment                        | string               | Environment setting                            |
| tracker                           | string               | Tracking identifier                            |
| authToken                         | string               | Authentication token                           |
| deviceDataCollectionJWT           | string               | Device data JWT                                |
| deviceDataCollectionURL           | string               | Device data collection endpoint                |
| billing                           | object               | Billing information object                     |
| onPayerAuthenticationFailure      | function            | `(data: any) => void`                         |
| onPayerAuthenticationSuccess      | function            | `(data: any) => void`                         |
| onPayerAuthenticationRequired     | function            | `({ tracker: string }) => void`                |
| onPayerAuthenticationFrictionless | function            | `({ tracker: string }) => void`                |
| onPayerAuthenticationUnavailable  | function            | `({ tracker: string }) => void`                |
| onSafepayError                    | function            | `(error: any) => void`                         |
| imperativeRef                     | React.MutableRefObject| Reference for imperative methods              |

## Project Structure

```
safepay-ui-links/
├── dist/                     # Compiled files
├── src/
│   ├── atoms/               # React components implementation
│   │   ├── CardCaptureIframe/
│   │   │   ├── iframe.tsx
│   │   │   ├── index.tsx
│   │   │   └── types.ts
│   │   ├── PayerAuthenticationIframe/
│   │   │   ├── iframe.tsx
│   │   │   ├── index.tsx
│   │   │   └── types.ts
│   │   └── index.ts
│   │
│   ├── elements/            # Web Components implementation
│   │   ├── CardCaptureAtom/
│   │   │   └── index.ts
│   │   ├── PayerAuthenticationAtom/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── styles/             # Styling utilities and configurations
│   │   ├── CardAtom/
│   │   ├── PayerAuthentication/
│   │   └── index.ts
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── atoms.ts
│   │   ├── components.ts
│   │   └── index.ts
│   │
│   ├── utils/              # Utility functions and helpers
│   │   ├── funcs/
│   │   │   ├── defineReactiveProperties.ts
│   │   │   ├── resolveBaseUrl.ts
│   │   │   └── toCamelCase.ts
│   │   └── index.ts
│   │
│   └── index.ts            # Main entry point
│
├── node_modules/           # Dependencies
├── tests/                  # Test files
│   ├── atoms/
│   └── elements/
│
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json
└── yarn.lock
```
