///<reference path='./models.d.ts' />
///<reference path='../models.d.ts' />

declare module '@sfpy/atoms' {
  namespace JSX {
    interface IntrinsicElements {
      'safepay-card-atom': CardAtomProps;
    }
  }
  interface Atoms {
    cardAtom: (config: CardAtomProps, elementID?: string) => void;
    styleChunks: StyleChunks;
    jsChunkImports: JSChunks;
  }
}
