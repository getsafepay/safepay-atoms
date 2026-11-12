import { SafepayAtom } from '../../types/atoms';
import { generateUUID } from '../../utils';
import { defineReactiveProperties } from '../../utils/funcs/defineReactiveProperties';

interface ImperativeRef {
  current: null | {};
}

export class PayerAuthenticationAtom extends HTMLElement {
  private _atom: SafepayAtom;
  public imperativeRef: ImperativeRef;

  constructor() {
    super();
    this.handleSafepayAtomsInitialized = this.handleSafepayAtomsInitialized.bind(this);
  }

  handleSafepayAtomsInitialized(): void {
    this.id = this.id || `safepay-payer-authentication-${generateUUID()}`;

    this.imperativeRef = this.imperativeRef || { current: null };

    const props: Record<string, unknown> = {};
    PayerAuthenticationAtom.componentProps.forEach((prop) => {
      if (prop in this) {
        props[prop] = this[prop];
      }
    });

    const atom = window.atoms.payerAuthentication(props, this.id);
    this._atom = atom;
  }

  connectedCallback(): void {
    this.handleSafepayAtomsInitialized();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;

    const propName = PayerAuthenticationAtom.attributeProps[name];
    if (propName) {
      this[propName] = newValue;
    }
  }

  /**
   * HTML attributes and the properties they set. Browsers lowercase attribute
   * names, so these must be kebab-case: a camelCase name such as `authToken`
   * would never match. Only string values belong here; callbacks and objects
   * (inputStyle, billing, discountBody, ...) must be set as properties.
   */
  static attributeProps: Record<string, string> = {
    environment: 'environment',
    tracker: 'tracker',
    'auth-token': 'authToken',
    user: 'user',
    'device-data-collection-jwt': 'deviceDataCollectionJWT',
    'device-data-collection-url': 'deviceDataCollectionURL',
  };

  static get observedAttributes(): string[] {
    return Object.keys(PayerAuthenticationAtom.attributeProps);
  }

  static componentProps: string[] = [
    'environment',
    'tracker',
    'authToken',
    'user',
    'billing',
    'discountBody',
    'deviceDataCollectionJWT',
    'deviceDataCollectionURL',
    'authorizationOptions',
    'onPayerAuthenticationFailure',
    'onPayerAuthenticationSuccess',
    'onPayerAuthenticationFrictionless',
    'onPayerAuthenticationRequired',
    'onPayerAuthenticationUnavailable',
    'onSafepayError',
    'onPaymentDeclined',
    'onPayerAuthenticationTimeout',
    'authenticationTimeoutMs',
    'imperativeRef',
  ];
}

defineReactiveProperties(PayerAuthenticationAtom, PayerAuthenticationAtom.componentProps);
