import { SafepayAtomFunctions } from './atoms';

export type Safepay = () => Promise<{
  atoms: SafepayAtomFunctions;
  version: string;
}>;
