import { SafepayDrop } from '../../types/drops';
import { generateUUID } from '../../utils';
import { defineReactiveProperties } from '../../utils/funcs/defineReactiveProperties';
import { toCamelCase } from '../../utils/funcs/toCamelCase';

interface ImperativeRef {
  current: null | {
    submit: () => void;
    validate: () => void;
    fetchValidity: () => boolean;
    clear: () => void;
  };
}

export class PayerAuthenticationAtom extends HTMLElement {
  private _drop: SafepayDrop;
  public imperativeRef: ImperativeRef;

  constructor() {
    super();
    this.handleSafepayDropsInitialized = this.handleSafepayDropsInitialized.bind(this);
  }

  handleSafepayDropsInitialized(): void {
    this.id = this.id || `safepay-payer-authentication-${generateUUID()}`;

    this.imperativeRef = this.imperativeRef || { current: null };

    const props: Record<string, unknown> = {};
    PayerAuthenticationAtom.componentProps.forEach((prop) => {
      if (prop in this) {
        props[prop] = this[prop];
      }
    });

    const drop = window.drops.payerAuthentication(props, this.id);
    this._drop = drop;
  }

  connectedCallback(): void {
    this.handleSafepayDropsInitialized();
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
    'deviceDataCollectionJWT',
    'deviceDataCollectionURL',
    'billing',
    'onPayerAuthenticationFailure',
    'onPayerAuthenticationSuccess',
    'onPayerAuthenticationFrictionless',
    'onPayerAuthenticationRequired',
    'onPayerAuthenticationUnavailable',
  ];

  static componentProps: string[] = [
    'environment',
    'tracker',
    'authToken',
    'deviceDataCollectionJWT',
    'deviceDataCollectionURL',
    'billing',
    'onPayerAuthenticationFailure',
    'onPayerAuthenticationSuccess',
    'onPayerAuthenticationFrictionless',
    'onPayerAuthenticationRequired',
    'onPayerAuthenticationUnavailable',
    'imperativeRef',
  ];
}

defineReactiveProperties(PayerAuthenticationAtom, PayerAuthenticationAtom.componentProps);
