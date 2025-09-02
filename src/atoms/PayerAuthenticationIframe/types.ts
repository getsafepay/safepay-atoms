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

interface SafepayError {
    error: {
        message: string,
        status: number
    }
}

import { Environment } from '../../types/environment';

export interface PayerAuthenticationProps {
  environment: Environment | string;
  tracker: string;
  authToken: string;
  deviceDataCollectionJWT: string;
  deviceDataCollectionURL: string;
  billing?: Billing;
  authorizationOptions?: {
    do_capture?: boolean;
    do_card_on_file?: boolean;
  };
  onPayerAuthenticationFailure?: (data: PayerAuthErrorData) => void;
  onPayerAuthenticationSuccess?: (data: PayerAuthSuccessData) => void;
  onPayerAuthenticationRequired?: (data: PayerAuthData) => void;
  onPayerAuthenticationFrictionless?: (data: PayerAuthData) => void;
  onPayerAuthenticationUnavailable?: (data: PayerAuthData) => void;
  onSafepayError?: (data: SafepayError) => void;
  imperativeRef: React.MutableRefObject<any>;
}
