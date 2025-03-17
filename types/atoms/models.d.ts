declare module '@sfpy/atoms' {
  interface CardAtomProps {
    authToken: string;
    tracker: string;
    environment: 'development' | 'sandbox' | 'production';
    validationEvent: 'submit' | 'change' | 'keydown' | 'none';
    onError?: (message: string) => void;
    onValidated?: () => void;
    onProceedToAuthorization?: (data: any) => void;
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
