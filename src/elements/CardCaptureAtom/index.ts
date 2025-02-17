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

/**
 * Defines a custom web component (`<safepay-card-atom>`) for integrating Safepay card capture functionality within web pages.
 * This component encapsulates the logic for initializing and managing a Safepay Drop for card information capture,
 * exposing a set of methods for programmatic interaction. It leverages custom elements to provide a declarative API
 * for embedding and controlling the Safepay card input within a web application.
 *
 * @property {ImperativeRef} imperativeRef - A reference object that exposes methods to interact with the card input programmatically, including submit, validate, fetchValidity, and clear.
 *
 * @fires handleSafepayDropsInitialized - Initializes the Safepay Drop once Safepay is ready or when the component is connected to the document.
 * @fires handleSafepayJsLoaded - Handles the loading of Safepay.js and initializes the drop accordingly.
 *
 * @listens connectedCallback - Lifecycle callback invoked when the component is added to the document's DOM.
 * @listens attributeChangedCallback - Lifecycle callback invoked when one of the component's observed attributes is added, removed, or changed.
 *
 * @method submit - Submits the card information if it has been entered.
 * @method validate - Validates the card information entered by the user.
 * @method fetchValidity - Returns a boolean indicating whether the entered card information is valid.
 * @method clear - Clears the card information input fields.
 *
 * @example
 * <!-- Adding the CardCaptureAtom to your HTML -->
 * <script src="path/to/safepay.js"></script>
 * <safepay-card-atom id="myCardAtom" environment="sandbox" auth-token="yourAuthToken"></safepay-card-atom>
 *
 * <script>
 *   // Accessing the component and invoking methods
 *   const myCardAtom = document.getElementById('myCardAtom');
 *   myCardAtom.submit();
 * </script>
 */
export class CardCaptureAtom extends HTMLElement {
  private _drop: SafepayDrop;
  public imperativeRef: ImperativeRef;

  constructor() {
    super();

    this.handleSafepayDropsInitialized =
      this.handleSafepayDropsInitialized.bind(this);
    this.handleSafepayJsLoaded = this.handleSafepayJsLoaded.bind(this);
  }

  handleSafepayDropsInitialized(): void {
    this.id = this.id || `safepay-card-atom-${generateUUID()}`;

    this.imperativeRef = this.imperativeRef || { current: null };

    const props: Record<string, unknown> = {};
    CardCaptureAtom.componentProps.forEach((prop) => {
      if (prop in this) {
        props[prop] = this[prop];
      }
    });

    const drop = window.drops.cardAtom(props, this.id);
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
    } else {
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
    return [
      "environment",
      "authToken",
      "tracker",
      "validationEvent",
      "onError",
      "onRequireChallenge",
      "onProceedToAuthorization",
    ];
  }

  static componentProps: string[] = [
    "environment",
    "authToken",
    "tracker",
    "validationEvent",
    "onValidated",
    "onError",
    "onRequireChallenge",
    "onProceedToAuthorization",
    "imperativeRef",
  ];
}

defineReactiveProperties(CardCaptureAtom, CardCaptureAtom.componentProps);
