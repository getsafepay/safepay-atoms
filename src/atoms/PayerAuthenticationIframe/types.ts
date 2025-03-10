interface PayerAuthData {
  tracker: string;
  request_id?: string;
}

interface PayerAuthErrorData extends PayerAuthData {
  error: string;
}

interface PayerAuthSuccessData extends PayerAuthData {
  authorization?: string;
  payment_method?: string;
}

interface Billing {
  street_1: string;
  street_2?: string;
  city: string;
  country: string;
  postal_code?: string;
}

export interface PayerAuthenticationProps {
  environment: string;
  tracker: string;
  authToken: string;
  deviceDataCollectionJWT: string;
  deviceDataCollectionURL: string;
  billing?: Billing;
  onPayerAuthenticationFailure?: (data: PayerAuthErrorData) => void;
  onPayerAuthenticationSuccess?: (data: PayerAuthSuccessData) => void;
  onPayerAuthenticationRequired?: (data: PayerAuthData) => void;
  onPayerAuthenticationFrictionless?: (data: PayerAuthData) => void;
  onPayerAuthenticationUnavailable?: (data: PayerAuthData) => void;
  imperativeRef: React.MutableRefObject<any>;
}
