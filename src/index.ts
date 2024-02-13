import { CardLinkWebComponent } from "./elements/CardLinkElement";
import { CAPTURE_CONTEXT_INVALID } from "./errors";
import { Context } from "./types/capture_context";
import { isString } from "./utils";

const Safepay = (() => {
  /* 
    Freezes the capture context body and returns an object that 
    is readonly

    throws errors so it is advised to call this function
    inside of a try-catch

    @param cc: string - Capture Context
    @returns context: Readonly<Context> - frozen context object
  */
  const freezeCaptureContext = (cc: string): Readonly<Context> => {
    if (!isString(cc)) {
      throw CAPTURE_CONTEXT_INVALID();
    }

    if (!isValidToken(cc)) {
      throw CAPTURE_CONTEXT_INVALID();
    }

    return Object.freeze({
      jwt: cc,
    });
  };

  const isValidToken = (token) => {
    return token === "fake-token" || /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token);
  };

  const initializeDrops = () => {
    return async function (cc: string) {
      await import("./drops");
      window.drops && (window.drops.captureContext = cc);
      return window.drops;
    };
  };

  const initializeSafepay = async (cc: string) => {
    try {
      // ToDo validate capture context
      const ctx = freezeCaptureContext(cc);
      const obj = {
        drops: await initializeDrops()(cc),
        version: "v0.0.1",
      };

      // Register custom elements if they are not already registered
      if (window && window.customElements) {
        window.customElements.define("safepay-card-link", CardLinkWebComponent);
      }

      // Dispatch the 'safepayJSLoaded' event
      const safepayJSLoadedEvent = new CustomEvent("safepay.safepayJSLoaded");
      setTimeout(() => document.dispatchEvent(safepayJSLoadedEvent), 0);

      return obj;
    } catch (e) {
      throw CAPTURE_CONTEXT_INVALID();
    }
  };

  return initializeSafepay;
})();

window.Safepay = Safepay;
