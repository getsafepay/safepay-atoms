import { PayerAuthenticationAtom, CardCaptureAtom } from './elements';
import { API_INTERNAL_ERROR, BRIDGE_INITIALIZION_ERROR } from './errors';

(async () => {
  try {
    await import('./atoms');
    if (!window.atoms) {
      throw BRIDGE_INITIALIZION_ERROR();
    }

    // Register custom elements if not already defined
    if (window?.customElements) {
      if (!customElements.get('safepay-card-atom')) {
        customElements.define('safepay-card-atom', CardCaptureAtom);
      }
      if (!customElements.get('safepay-payer-auth-atom')) {
        customElements.define('safepay-payer-auth-atom', PayerAuthenticationAtom);
      }
    }

    // Expose Safepay API
    window.Safepay = {
      atoms: window.atoms,
      version: 'v0.0.1',
    };
  } catch (e) {
    console.error(e);
    throw API_INTERNAL_ERROR();
  }
})();
