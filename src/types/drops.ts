import { FC } from 'react';

/**
 * Interface defining the methods available on a SafepayDrop instance
 */
export interface SafepayDrop {
  remove: () => void;
  render: (newProps: any) => void;
}

/**
 * Interface for style chunk references
 */
export interface StyleChunks {
  index?: HTMLStyleElement;
  SeamlessIframe?: HTMLStyleElement;
  CardAtom?: HTMLStyleElement;
  PayerAuthentication?: HTMLStyleElement;
}

/**
 * Interface for JavaScript chunk references
 */
export interface JSChunks {
  index?: string[];
  SeamlessIframe?: string[];
  CardAtom?: string[];
  PayerAuthentication?: string[];
}

/**
 * Interface defining all available Safepay Drop functionality
 */
export interface SafepayDropFunctions {
  cardAtom: (props: { [key: string]: any }, id: string) => SafepayDrop;
  payerAuthentication: (props: { [key: string]: any }, id: string) => SafepayDrop;
  components: {
    CardAtom: FC;
    PayerAuthentication: FC;
  };
  styleChunks: StyleChunks;
  jsChunkImports: JSChunks;
}
