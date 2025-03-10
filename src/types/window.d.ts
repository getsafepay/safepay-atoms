import { SafepayAtomFunctions } from './atoms';
import { Safepay } from './safepay';

declare global {
  interface Window {
    Safepay: Safepay;
    atoms: SafepayAtomFunctions;
  }
}
