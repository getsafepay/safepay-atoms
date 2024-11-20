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
 * Defines a custom web component (`<device-metrics-web-component>`) for collecting device data during payment processing.
 * This component encapsulates the logic for initializing and managing a Safepay Drop specifically for device fingerprinting
 * and data collection. It helps gather essential device information used in fraud prevention and payment authentication
 * processes.
 *
 * @property {SafepayDrop} _drop - Private property holding the instance of SafepayDrop for device data collection.
 * @property {ImperativeRef} imperativeRef - A reference object that provides programmatic control over the device metrics component.
 *
 * @fires handleSafepayDropsInitialized - Initializes the Safepay Drop for device data collection when Safepay is ready.
 * @fires handleSafepayJsLoaded - Handles the loading of Safepay.js and sets up the device metrics drop accordingly.
 *
 * @listens connectedCallback - Lifecycle callback invoked when the component is added to the document's DOM.
 * @listens attributeChangedCallback - Lifecycle callback triggered when observed attributes are modified.
 *
 * @attribute deviceDataCollectionJWT - JWT token required for secure device data collection.
 * @attribute deviceDataCollectionURL - URL endpoint where device data will be sent.
 *
 * @property inputStyle - Customization options for the component's visual appearance.
 * @property onError - Callback function triggered when device data collection encounters an error.
 * @property onSuccess - Callback function triggered when device data is successfully collected.
 *
 * @example
 * <!-- Adding the DeviceMetricsWebComponent to your HTML -->
 * <script src="path/to/safepay.js"></script>
 * <device-metrics-web-component
 *   id="deviceMetrics"
 *   device-data-collection-jwt="your-jwt"
 *   device-data-collection-url="your-url"
 * ></device-metrics-web-component>
 *
 * <script>
 *   // Accessing the component
 *   const deviceMetrics = document.getElementById('deviceMetrics');
 *
 *   // Example of handling success
 *   deviceMetrics.onSuccess = (data) => {
 *     console.log('Device data collected successfully:', data);
 *   };
 *
 *   // Example of handling errors
 *   deviceMetrics.onError = (error) => {
 *     console.error('Device data collection failed:', error);
 *   };
 * </script>
 */
export class DeviceMetricsWebComponent extends HTMLElement {
  private _drop: SafepayDrop;
  public imperativeRef: ImperativeRef;

  constructor() {
    super();

    this.handleSafepayDropsInitialized =
      this.handleSafepayDropsInitialized.bind(this);
    this.handleSafepayJsLoaded = this.handleSafepayJsLoaded.bind(this);
  }

  handleSafepayDropsInitialized(): void {
    this.id = this.id || `safepay-device-metrics-${generateUUID()}`;

    this.imperativeRef = this.imperativeRef || { current: null };

    const props: Record<string, unknown> = {};
    DeviceMetricsWebComponent.componentProps.forEach((prop) => {
      if (prop in this) {
        props[prop] = this[prop];
      }
    });

    const drop = window.drops.deviceMetrics(props, this.id);
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
      "deviceDataCollectionJWT",
      "deviceDataCollectionURL",
      "onError",
      "onSuccess",
    ];
  }

  static componentProps: string[] = [
    "environment",
    "deviceDataCollectionJWT",
    "deviceDataCollectionURL",
    "inputStyle",
    "onError",
    "onSuccess",
    "imperativeRef",
  ];
}

defineReactiveProperties(
  DeviceMetricsWebComponent,
  DeviceMetricsWebComponent.componentProps,
);
