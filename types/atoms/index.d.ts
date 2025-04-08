///<reference path='./models.d.ts' />
///<reference path='../models.d.ts' />

declare module '@sfpy/atoms' {
  namespace JSX {
    interface IntrinsicElements {
      'safepay-card-atom': CardAtomProps;
    }
  }
  interface CardAtom extends HTMLElement, CardAtomProps {
    submit: () => void;
    validate: () => void;
    clear: () => void;
    fetchValidity: () => Promise<boolean>;
  }
  interface Atoms {
    cardAtom: (config: CardAtomProps, elementID?: string) => CardAtom;
    styleChunks: StyleChunks;
    jsChunkImports: JSChunks;
  }
}
