import { DeviceMetricsWebComponent } from "./elements";
import { CardLinkWebComponent } from "./elements/CardLinkElement";
import { API_INTERNAL_ERROR } from "./errors";

const Safepay = (() => {
  const initializeDrops = () => {
    return async function () {
      await import("./drops");
      window.drops;
      return window.drops;
    };
  };

  const initializeSafepay = async (cc: string) => {
    try {
      const obj = {
        drops: await initializeDrops()(),
        version: "v0.0.1",
      };

      // Register custom elements if they are not already registered
      if (window && window.customElements) {
        window.customElements.define("safepay-card-link", CardLinkWebComponent);
        window.customElements.define(
          "safepay-device-metrics",
          DeviceMetricsWebComponent,
        );
      }

      // Dispatch the 'safepayJSLoaded' event
      const safepayJSLoadedEvent = new CustomEvent("safepay.safepayJSLoaded");
      setTimeout(() => document.dispatchEvent(safepayJSLoadedEvent), 0);

      return obj;
    } catch (e) {
      throw API_INTERNAL_ERROR();
    }
  };

  return initializeSafepay;
})();

window.Safepay = Safepay;
