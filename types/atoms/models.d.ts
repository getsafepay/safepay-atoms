declare module '@sfpy/atoms' {
  export enum Environment {
    Development = 'development',
    Production = 'production',
    Sandbox = 'sandbox',
    Local = 'local',
  }
  interface CardAtomProps {
    authToken: string;
    tracker: string;
    environment: Environment;
    validationEvent: 'submit' | 'change' | 'keydown' | 'none';
    onReady?: () => void;
    onError?: (message: string) => void;
    onValidated?: () => void;
    onProceedToAuthentication?: (data: any) => void;
  }
  interface CardAtomMethods {
    submit: () => void;
    validate: () => void;
    clear: () => void;
    fetchValidity: () => Promise<boolean>;
  }
  interface StyleChunks {
    index?: HTMLStyleElement;
    SeamlessIframe?: HTMLStyleElement;
    CardAtom?: HTMLStyleElement;
    PayerAuthentication?: HTMLStyleElement;
  }
  interface JSChunks {
    index?: string[];
    SeamlessIframe?: string[];
    CardAtom?: string[];
    PayerAuthentication?: string[];
  }
}
