import { SafepayDropFunctions } from './drops';

export type Safepay = () => Promise<{
  drops: SafepayDropFunctions;
  version: string;
}>;
