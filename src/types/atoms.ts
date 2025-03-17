/**
 * Interface defining the methods available on a SafepayAtom instance
 */
export interface SafepayAtom {
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
 * Interface defining all available Safepay Atom functionality
 */
export interface SafepayAtomFunctions {
  cardAtom: (props: { [key: string]: any }, id: string) => SafepayAtom;
  payerAuthentication: (props: { [key: string]: any }, id: string) => SafepayAtom;
  styleChunks: StyleChunks;
  jsChunkImports: JSChunks;
}
