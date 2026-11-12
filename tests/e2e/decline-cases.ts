import { expect, Page } from '@playwright/test';
import type { TestCardFlow } from './test-cards';

// The public callback each key in window.__atomsCallbacks records.
export const CALLBACK_NAMES = {
  declined: 'onPaymentDeclined',
  unavailable: 'onPayerAuthenticationUnavailable',
  failure: 'onPayerAuthenticationFailure',
  success: 'onPayerAuthenticationSuccess',
  frictionless: 'onPayerAuthenticationFrictionless',
  timeout: 'onPayerAuthenticationTimeout',
} as const;

export interface DeclineCase {
  title: string;
  flow: TestCardFlow;
  // Whether the merchant set onPaymentDeclined.
  declinedHandler: boolean;
  // The only callback that may fire for the decline.
  expected: 'declined' | 'unavailable' | 'failure';
  // The failure event drops sends straight after payment__declined, for older
  // atoms versions.
  failureEvent: string;
}

const declineCase = (flow: TestCardFlow, declinedHandler: boolean): DeclineCase => {
  const expected: DeclineCase['expected'] = declinedHandler
    ? 'declined'
    : flow === 'frictionless'
      ? 'unavailable'
      : 'failure';
  const flowName = flow === 'frictionless' ? 'frictionless' : 'challenge';
  return {
    title: `${flowName} decline → only ${CALLBACK_NAMES[expected]} (onPaymentDeclined ${declinedHandler ? 'set' : 'not set'})`,
    flow,
    declinedHandler,
    expected,
    failureEvent:
      flow === 'frictionless' ? 'safepay-inframe__enrollment__failed' : 'safepay-inframe__cardinal-3ds__failure',
  };
};

// A payment that authenticates and is then declined by the issuer is reported
// to exactly one callback, depending on whether onPaymentDeclined is set.
export const DECLINE_CASES: DeclineCase[] = [
  declineCase('frictionless', true),
  declineCase('frictionless', false),
  declineCase('step-up', true),
  declineCase('step-up', false),
];

// Drops can only detect a frictionless decline when it is built with
// @sfpy/node-core 0.3.7 or later (node-core #40). Until then it reports the
// decline as enrollment__failed alone, so onPaymentDeclined cannot fire.
export const needsNewerDrops = (c: DeclineCase) => c.flow === 'frictionless' && c.declinedHandler;
export const NEEDS_NEWER_DROPS_REASON = 'Needs drops built with @sfpy/node-core >= 0.3.7';

// Time for a callback that should NOT fire to arrive after the expected one.
export const MOCK_SETTLE_MS = 500;
export const LIVE_SETTLE_MS = 3_000;

export const DECLINE_DETAIL = {
  responseCode: '51',
  merchantAdvice: { code: '01', codeRaw: 'M001' },
};

// Sends a decline from the mocked authlink iframe the way drops reports one:
// payment__declined, then the failure event for older atoms versions.
export const sendDeclineFromMockedDrops = async (page: Page, c: DeclineCase) => {
  // The auth iframe can reload while the atoms settle, so wait for the current
  // one to receive its properties before sending events from it.
  await expect
    .poll(async () => {
      const frame = page.frame({ url: /\/drops\/authlink/ });
      return frame
        ?.evaluate(() => Boolean((window as any).__messageLog?.lastPropMessageId))
        .catch(() => false);
    })
    .toBe(true);
  const authFrame = page.frame({ url: /\/drops\/authlink/ });
  if (!authFrame) throw new Error('authlink frame not found');

  await authFrame.evaluate(
    ({ failureEvent, detail }) => {
      const parentOrigin = new URL(
        new URL(window.location.href).searchParams.get('parentOrigin') || document.referrer
      ).origin;
      const send = (name: string, eventDetail: unknown) =>
        window.parent.postMessage({ type: 'safepay-inframe-event', name, detail: eventDetail }, parentOrigin);

      send('safepay-inframe__payment__declined', detail);
      send(failureEvent, { error: 'declined' });
    },
    { failureEvent: c.failureEvent, detail: DECLINE_DETAIL }
  );
};

// Waits for the expected callback, gives any other callback time to arrive,
// then checks the expected one was the only one.
export const expectOnlyCallback = async (
  page: Page,
  c: DeclineCase,
  { timeout, settleMs, tracker }: { timeout: number; settleMs: number; tracker?: string }
) => {
  await page.waitForFunction((name) => Boolean((window as any).__atomsCallbacks[name]), c.expected, { timeout });
  await page.waitForTimeout(settleMs);

  const callbacks = await page.evaluate(() => (window as any).__atomsCallbacks);
  expect(callbacks.calls.map((key: keyof typeof CALLBACK_NAMES) => CALLBACK_NAMES[key] ?? key)).toEqual([
    CALLBACK_NAMES[c.expected],
  ]);
  if (c.declinedHandler) {
    expect(callbacks.declined.responseCode).toBe(DECLINE_DETAIL.responseCode);
    if (tracker) expect(callbacks.declined.tracker).toBe(tracker);
  }
};
