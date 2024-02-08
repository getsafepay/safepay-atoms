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
      throw new Error();
    }

    // support demo's
    if (cc === "fake-token") {
      return Object.freeze({ jwt: cc });
    }

    return Object.freeze({
      jwt: cc,
    });
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

// const MoovJS = (() => {
//   const initializeMoov = (accessToken) => {
//     if (!isValidToken(accessToken)) {
//       throw new Error(
//         "Please initialize Moov.js with a valid Moov access token."
//       );
//     }

//     //const apiContext = createAPIContext(accessToken);
//     return {
//       // ping: createPingService(apiContext),
//       // enrichment: createEnrichmentService(apiContext),
//       // institutions: createInstitutionsService(apiContext),
//       // accounts: createAccountsService(apiContext),
//       // setToken: (newToken) => initializeMoov(newToken),
//       // plaid: createPlaidService(apiContext),
//       // drops: initializeDrops(accessToken),
//       version: "v0.6.5",
//     };
//   };

//   const isValidToken = (token) => {
//     return token === "fake-token" || /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token);
//   };

//   const initializeDrops = (token) => () => {
//     // await loadModule(210); // Assuming `i.e(210).then(i.bind(i, 210))` is module loading
//     // window.drops && (window.drops.safepayAccessToken = token);
//     // return window.drops;
//   };

//   // Register custom elements if they are not already registered
//   if (window.customElements) {
//     // registerCustomElement("safepay-card-link", CardLinkElement);
//     // registerCustomElement("safepay-file-upload", FileUploadElement);
//     // registerCustomElement("safepay-issued-card", IssuedCardElement);
//     // ... other custom elements ...
//   }

//   // Dispatch the 'safepayJSLoaded' event
//   const safepayJSLoadedEvent = new CustomEvent("safepay.safepayJSLoaded");
//   setTimeout(() => document.dispatchEvent(safepayJSLoadedEvent), 0);

//   return initializeMoov;
// })();

// // Export the library
// // window.Moov = MoovJS;
