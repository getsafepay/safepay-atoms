export interface PayerAuthData {
  tracker: string;
  request_id?: string;
  errorMessage?: string;
}

export interface PayerAuthErrorData extends PayerAuthData {
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

/** Why a payer-authentication attempt ended without success. */
export type PayerAuthenticationErrorReason =
  | 'failure'
  | 'declined'
  | 'timeout'
  | 'unavailable';

/**
 * A single negative-outcome event for the payer-authentication atom, reported
 * through `onPayerAuthenticationError`. Discriminate on `reason`:
 *   - `failure`     — 3DS challenge authentication failed (`error`).
 *   - `declined`    — the card issuer declined (`responseCode`, `merchantAdvice`).
 *   - `timeout`     — a required challenge produced no outcome in time (`timeoutMs`).
 *   - `unavailable` — enrollment could not be completed (no 3DS ran); depending
 *                     on the merchant's setup the payment may still proceed to
 *                     authorization, so branch on `reason` rather than treating
 *                     every event as fatal.
 * Every variant carries `tracker`. Display-only — confirm the final payment
 * status server-side before acting on it.
 */
export type PayerAuthenticationError =
  | ({ reason: 'failure' } & PayerAuthErrorData)
  | ({ reason: 'declined' } & PaymentDeclinedData)
  | ({ reason: 'timeout' } & PayerAuthenticationTimeoutData)
  | ({ reason: 'unavailable' } & PayerAuthData);

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
  /**
   * Unified negative-outcome callback. When provided, every non-success outcome
   * — a 3DS authentication failure, an issuer decline, a challenge timeout, or
   * enrollment being unavailable — is reported here, discriminated by `reason`,
   * and the deprecated per-outcome callbacks below do NOT fire (so a single
   * outcome is reported exactly once). When omitted, the released callbacks fire
   * exactly as before.
   */
  onPayerAuthenticationError?: (data: PayerAuthenticationError) => void;
  /**
   * @deprecated Use `onPayerAuthenticationError` and handle `reason === 'failure'`.
   * Still fires when `onPayerAuthenticationError` is not provided.
   */
  onPayerAuthenticationFailure?: (data: PayerAuthErrorData) => void;
  onPayerAuthenticationSuccess?: (data: PayerAuthSuccessData) => void;
  onPayerAuthenticationRequired?: (data: PayerAuthData) => void;
  onPayerAuthenticationFrictionless?: (data: PayerAuthData) => void;
  /**
   * @deprecated Use `onPayerAuthenticationError` and handle `reason === 'unavailable'`.
   * Still fires when `onPayerAuthenticationError` is not provided.
   */
  onPayerAuthenticationUnavailable?: (data: PayerAuthData) => void;
  onSafepayError?: (data: SafepayError) => void;
  /**
   * How long to wait for a 3DS challenge outcome, in milliseconds, measured
   * from when the challenge is required. Defaults to 10 minutes. `0` disables it.
   */
  authenticationTimeoutMs?: number;
  imperativeRef: React.MutableRefObject<any>;
}
