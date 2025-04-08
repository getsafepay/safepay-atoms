import { PayerAuthenticationAtom, CardCaptureAtom } from './elements';
import { API_INTERNAL_ERROR } from './errors';

const Safepay = (() => {
  const initializeAtoms = async () => {
    await import('./bridge');
    return {
      atoms: window.atoms,
    };
  };
  const initializeSafepay = async () => {
    try {
      const { atoms } = await initializeAtoms();
      const obj = {
        atoms,
        version: 'v0.0.1',
      };

      // Register custom elements if they are not already registered
      if (window && window.customElements) {
        window.customElements.define('safepay-card-atom', CardCaptureAtom);
        window.customElements.define('safepay-payer-auth-atom', PayerAuthenticationAtom);
      }

      return obj;
    } catch (e) {
      throw API_INTERNAL_ERROR();
    }
  };

  return initializeSafepay;
})();

window.Safepay = Safepay;
