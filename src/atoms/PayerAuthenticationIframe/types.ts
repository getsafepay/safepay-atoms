interface PayerAuthData {
  tracker: string;
  request_id?: string;
  errorMessage?: string;
}

interface PayerAuthErrorData extends PayerAuthData {
  error: string;
}

interface PayerAuthSuccessData extends PayerAuthData {
  authorization?: string;
  payment_method?: string;
}

/**
 * Sent when the card issuer declined the payment (e.g. insufficient funds), as
 * opposed to an authentication or integration failure. Display-only: confirm
 * the final payment status server-side before acting on it.
 */
export interface PaymentDeclinedData {
  tracker: string;
  /** Issuer / network response code (ISO 8583), e.g. "51" for insufficient funds. */
  responseCode: string;
  /** Card network merchant advice code, when the issuer sent one. */
  merchantAdvice?: { code?: string; codeRaw?: string };
  /** Shopper-safe description of the decline. */
  errorMessage: string;
  request_id?: string;
}

/** Sent when a 3DS challenge hasn't finished within `authenticationTimeoutMs`. */
export interface PayerAuthenticationTimeoutData {
  tracker: string;
  /** The timeout that elapsed, in milliseconds. */
  timeoutMs: number;
}

interface Billing {
  street_1: string;
  street_2?: string;
  city: string;
  state?: string;
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

export type DiscountBody = {
  dry_run: boolean;
  bin_discount: { cardscheme_id: string; bin: string };
};

export interface PayerAuthenticationProps {
  environment: Environment | string;
  tracker: string;
  authToken: string;
  discountBody?: DiscountBody;
  deviceDataCollectionJWT: string;
  deviceDataCollectionURL: string;
  user?: string;
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
  /**
   * Called when the issuer declined the payment. Declines still also call
   * `onPayerAuthenticationUnavailable` (frictionless) or
   * `onPayerAuthenticationFailure` (after a 3DS challenge) for backwards
   * compatibility; that will be removed in a future minor version.
   */
  onPaymentDeclined?: (data: PaymentDeclinedData) => void;
  /**
   * Called once if a 3DS challenge started but no outcome arrived within
   * `authenticationTimeoutMs` (shopper abandoned it, or the connection dropped).
   */
  onPayerAuthenticationTimeout?: (data: PayerAuthenticationTimeoutData) => void;
  /**
   * How long to wait for a 3DS challenge outcome, in milliseconds, measured
   * from when the challenge is required. Defaults to 10 minutes. `0` disables it.
   */
  authenticationTimeoutMs?: number;
  imperativeRef: React.MutableRefObject<any>;
}
