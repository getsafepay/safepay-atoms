import { SafepayDropFunctions } from './drops';
import { Safepay } from './safepay';

declare global {
  interface Window {
    Safepay: Safepay;
    drops: SafepayDropFunctions;
  }
}
