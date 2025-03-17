///<reference path='./atoms/models.d.ts' />

declare module '@sfpy/atoms' {
  export type Safepay = () => Promise<{
    atoms: Atoms;
    version: string;
  }>;
}
