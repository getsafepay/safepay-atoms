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

export class CardLinkWebComponent extends HTMLElement {
  private _drop: SafepayDrop;
  private captureContext: string;
  public imperativeRef: ImperativeRef;

  constructor() {
    super();

    this.handleSafepayDropsInitialized =
      this.handleSafepayDropsInitialized.bind(this);
    this.handleSafepayJsLoaded = this.handleSafepayJsLoaded.bind(this);
  }

  handleSafepayDropsInitialized(): void {
    this.id = this.id || `safepay-card-link-${generateUUID()}`;
    this.captureContext = window.drops.captureContext || "fake-token";

    this.imperativeRef = this.imperativeRef || { current: null };

    const props: Record<string, unknown> = {};
    CardLinkWebComponent.componentProps.forEach((prop) => {
      if (prop in this) {
        props[prop] = this[prop];
      }
    });

    const drop = window.drops.cardLink(props, this.id);
    this._drop = drop;
  }

  handleSafepayJsLoaded(): void {
    document.removeEventListener(
      "safepay.safepayJSLoaded",
      this.handleSafepayJsLoaded
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
        this.handleSafepayJsLoaded
      );
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue) return;

    let propName = toCamelCase(name);

    if (propName in this) {
      this[propName] = newValue;
    }
  }

  submit(): void {
    this.imperativeRef.current?.submit?.();
  }

  validate(): void {
    this.imperativeRef.current?.validate?.();
  }

  fetchValidity(): boolean | undefined {
    return this.imperativeRef.current?.fetchValidity?.();
  }

  clear(): void {
    this.imperativeRef.current?.clear?.();
  }

  static get observedAttributes(): string[] {
    return ["validation-event", "environment"];
  }

  static componentProps: string[] = [
    "environment",
    "captureContext",
    "validationEvent",
    "inputStyle",
    "onEnterKeyPress",
    "onError",
    "onValidated",
    "onSuccess",
    "imperativeRef",
  ];
}

defineReactiveProperties(
  CardLinkWebComponent,
  CardLinkWebComponent.componentProps
);
