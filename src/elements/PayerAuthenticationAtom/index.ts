import { SafepayDrop } from "../../drops";
import { Context } from "../../types/capture_context";
import { generateUUID } from "../../utils";
import { defineReactiveProperties } from "../../utils/funcs/defineReactiveProperties";
import { toCamelCase } from "../../utils/funcs/toCamelCase";

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

    this.handleSafepayDropsInitialized =
      this.handleSafepayDropsInitialized.bind(this);
    this.handleSafepayJsLoaded = this.handleSafepayJsLoaded.bind(this);
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

  handleSafepayJsLoaded(): void {
    document.removeEventListener(
      "safepay.safepayJSLoaded",
      this.handleSafepayJsLoaded,
    );
    if (window.Safepay && !window.drops) {
      window.Safepay().drops().then(this.handleSafepayDropsInitialized);
    }
  }

  connectedCallback(): void {
    if (window.drops) {
      this.handleSafepayDropsInitialized();
    }
    // else if (window.Safepay && !window.drops) {
    //   this.handleSafepayJsLoaded();
    // }
    else {
      document.addEventListener(
        "safepay.safepayJSLoaded",
        this.handleSafepayJsLoaded,
      );
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void {
    if (oldValue === newValue) return;

    let propName = toCamelCase(name);

    if (propName in this) {
      this[propName] = newValue;
    }
  }

  static get observedAttributes(): string[] {
    return [
      "environment",
      "threeDSJWT",
      "threeDSURL",
      "onPayerAuthenticationFailure",
      "onPayerAuthenticationSuccess",
    ];
  }

  static componentProps: string[] = [
    "environment",
    "threeDSJWT",
    "threeDSURL",
    "onPayerAuthenticationFailure",
    "onPayerAuthenticationSuccess",
    "imperativeRef",
  ];
}

defineReactiveProperties(
  PayerAuthenticationAtom,
  PayerAuthenticationAtom.componentProps,
);
