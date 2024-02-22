# safepay-atoms

Use this module to initialize Safepay Atoms in your client side web application.

## Install

Include Safepay Atoms in your application by loading the Safepay Atoms script, or downloading the Safepay Atoms package via npm.

### Script tag

```html
<script type="text/javascript" src="https://unpackage.com"></script>
```

### yarn

```sh
yarn add @sfpy/atoms
```

## Authenticate

To use Safepay Atoms, in particular the Card Link form, you will need to generate a unique session that contains information needed to securely communicate with Safepay to tokenize sensitive payment information like card details.

You must generate this session from your serve-side application. Once you've generated a token, send it back to your client to use with Safepay Atoms.

### Create a session

The example below creates a session with a few configurations. See the documentation for generating a session for more details.

```sh
curl --location 'https://api.getsafepay.com/order/vault/v1/session' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer _XvORgITVcG6xbvBipaq-oS8JFZXI1iPCPRBTmywMipvUYi_j5qJCBSNCUbUwk6WFlbtT06Sqg==' \
--data '{
    "allowed_card_networks": [
        "visa",
        "mastercard",
        "american-express"
    ],
    "origin": "getsafepay.com",
    "target_origin": [
        "https://your-website.com"
    ]
}'
```

## Initialize

Once you’ve generated a session from your server, initialize Safepay Atoms in the browser by passing the token to Safepay.

```html
<script>
  const safepay = Safepay(session);
</script>
```

Or if you're in a React application (for example)

```js
import { loadSafepay } from '@sfpy/atoms';

const safepaySession = await fetch(...);
const safepay = await loadSafepay(safepaySession);
```

## Developing

This library is written in Typescript and requires Node >= v18. We use `parcel.js` to build and minify the files. You can read more about Parcel on their [website](https://parceljs.org/getting-started/library/)

### Project structure

```
├── .parcel-cache
├── dist
├── node_modules
├── src
│   ├── drops
│   │   ├── CardLinkIframe
│   │   ├── hooks
│   │   ├── index.tsx
│   ├── elements
│   │   ├── CardLinkElement
│   │   ├── index.ts
│   ├── styles
│   ├── types
│   ├── utils
│   ├── errors.ts
│   ├── index.ts
│   ├── utils.ts
├── package.json
├── README.md
├── tsconfig.json
├── yarn.lock
└── .gitignore
```

### Setup

Run `yarn` from the root of this repository to install the dependencies.

### Start dev server

Run `yarn serve` to build the project and run a server that will serve on `http://localhost:1234`

### Building for production

Run `yarn build` to build a production build.
