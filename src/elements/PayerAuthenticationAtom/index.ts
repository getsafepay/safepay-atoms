import { SafepayAtom } from '../../types/atoms';
import { generateUUID } from '../../utils';
import { defineReactiveProperties } from '../../utils/funcs/defineReactiveProperties';
import { toCamelCase } from '../../utils/funcs/toCamelCase';

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

    let propName = toCamelCase(name);

    if (propName in this) {
      this[propName] = newValue;
    }
  }

  static observedAttributes: string[] = [
    'environment',
    'tracker',
    'authToken',
    'user',
    'billing',
    'deviceDataCollectionJWT',
    'deviceDataCollectionURL',
    'authorizationOptions',
    'onPayerAuthenticationFailure',
    'onPayerAuthenticationSuccess',
    'onPayerAuthenticationFrictionless',
    'onPayerAuthenticationRequired',
    'onPayerAuthenticationUnavailable',
    'onSafepayError'
  ];

  static componentProps: string[] = [
    'environment',
    'tracker',
    'authToken',
    'user',
    'billing',
    'deviceDataCollectionJWT',
    'deviceDataCollectionURL',
    'authorizationOptions',
    'onPayerAuthenticationFailure',
    'onPayerAuthenticationSuccess',
    'onPayerAuthenticationFrictionless',
    'onPayerAuthenticationRequired',
    'onPayerAuthenticationUnavailable',
    'onSafepayError',
    'imperativeRef',
  ];
}

defineReactiveProperties(PayerAuthenticationAtom, PayerAuthenticationAtom.componentProps);
