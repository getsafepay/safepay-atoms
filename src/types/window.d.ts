import { SafepayDropFunctions } from "../drops";

declare global {
  interface Window {
    Safepay: any;
    drops: SafepayDropFunctions;
  }
}
