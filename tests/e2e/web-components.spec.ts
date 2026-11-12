import { expect, test, Page, Frame } from '@playwright/test';
import { createLiveSession, createTracker, INSUFFICIENT_FUNDS_AMOUNT, LiveSession } from './live-session';
import { LIVE_DECLINE_CARDS, REGRESSION_CARDS, TestCard } from './test-cards';
import {
  DECLINE_CASES,
  expectOnlyCallback,
  LIVE_SETTLE_MS,
  MOCK_SETTLE_MS,
  needsNewerDrops,
  NEEDS_NEWER_DROPS_REASON,
  sendDeclineFromMockedDrops,
} from './decline-cases';

const useRealDrops = process.env.USE_REAL_DROPS === '1';
const dropsEnv = (process.env.DROPS_ENV || 'sandbox').toLowerCase();

const waitForFrameUrl = async (page: Page, substring: string): Promise<Frame> => {
  const existing = page.frames().find((frame) => frame.url().includes(substring) && frame.url() !== 'about:blank');
  if (existing) return existing;

  const navigated = page.waitForEvent('framenavigated', (frame) => frame.url().includes(substring));
  const attached = page.waitForEvent('frameattached', (frame) => frame.url().includes(substring));
  return Promise.race([navigated, attached]);
};

// declinedHandler: whether the host sets onPaymentDeclined. Atoms reports a
// decline differently depending on whether the merchant provided it.
const renderHost = async (page: Page, { declinedHandler = false }: { declinedHandler?: boolean } = {}) => {
  if (!page.url().startsWith('http://localhost:4173')) {
    await page.goto('http://localhost:4173');
  }

  await page.setContent(
    `
<!doctype html>
<html>
  <head>
    <script src="http://localhost:4173/dist/components/index.global.js"></script>
  </head>
  <body>
    <div class="card-frame">
      <safepay-card-atom></safepay-card-atom>
    </div>
    <div id="threeds-modal" class="modal hide">
      <safepay-payer-auth-atom></safepay-payer-auth-atom>
    </div>
    <script>
      (function () {
        const setup = async () => {
          await Promise.all([
            customElements.whenDefined('safepay-card-atom'),
            customElements.whenDefined('safepay-payer-auth-atom'),
          ]);

          const cardAtom = document.querySelector('safepay-card-atom');
          const payerAuthAtom = document.querySelector('safepay-payer-auth-atom');
          const modal = document.getElementById('threeds-modal');

          cardAtom.validationEvent = 'submit';
          cardAtom.onProceedToAuthentication = function (data) {
            payerAuthAtom.deviceDataCollectionJWT = data.accessToken;
            payerAuthAtom.deviceDataCollectionURL = data.deviceDataCollectionURL;
            modal.classList.remove('hide');
            modal.classList.add('show');
            window.__atomsCallbacks.proceedToAuthentication = data;
          };

          // Records the payer auth outcome callbacks in the order they fire.
          const record = (name, data) => {
            window.__atomsCallbacks[name] = data;
            window.__atomsCallbacks.calls.push(name);
          };

          payerAuthAtom.onPayerAuthenticationSuccess = function (data) {
            modal.classList.remove('show');
            modal.classList.add('hide');
            record('success', data);
          };
          payerAuthAtom.onPayerAuthenticationFailure = function (data) {
            modal.classList.remove('show');
            modal.classList.add('hide');
            record('failure', data);
          };
          payerAuthAtom.onPayerAuthenticationFrictionless = function (data) {
            record('frictionless', data);
          };
          payerAuthAtom.onPayerAuthenticationUnavailable = function (data) {
            record('unavailable', data);
          };
          payerAuthAtom.onPayerAuthenticationTimeout = function (data) {
            record('timeout', data);
          };
          if (${declinedHandler}) {
            payerAuthAtom.onPaymentDeclined = function (data) {
              modal.classList.remove('show');
              modal.classList.add('hide');
              record('declined', data);
            };
          }

          window.__atomsCallbacks = {
            proceedToAuthentication: null,
            success: null,
            failure: null,
            frictionless: null,
            unavailable: null,
            timeout: null,
            declined: null,
            calls: [],
          };
          window.__atomsHost = { cardAtom, payerAuthAtom, modal };
          window.__atomsHostReady = true;
        };

        setup();
      })();
    </script>
  </body>
</html>
`,
    { waitUntil: 'load' }
  );
};


const createMockDropsPage = (label: string, options?: { autoAck?: boolean }) => `
<!doctype html>
<html>
  <body>
    <div id="stub-${label}">Mocked ${label}</div>
    <script>
      (function () {
        const resolveExactOrigin = (value) => {
          if (!value) return null;
          try {
            const origin = new URL(value, window.location.href).origin;
            return origin === 'null' ? null : origin;
          } catch {
            return null;
          }
        };

        const parentOrigin =
          resolveExactOrigin(new URL(window.location.href).searchParams.get('parentOrigin')) ||
          resolveExactOrigin(document.referrer);

        const sendEvent = (name, detail) => {
          if (!parentOrigin) return;
          window.parent.postMessage({ type: 'safepay-inframe-event', name, detail }, parentOrigin);
        };

        window.__messageLog = {
          received: [],
          counts: {},
          lastProps: null,
          lastPropMessageId: null,
          parentOrigin,
          autoAck: ${options?.autoAck ?? true},
        };

        sendEvent('safepay-inframe__ready');

        window.addEventListener('message', (event) => {
          const data = event.data || {};
          if (!parentOrigin || event.origin !== parentOrigin) return;
          if (!data.type) return;

          const id = data.messageId || 'no-id';
          window.__messageLog.received.push(data);
          window.__messageLog.counts[id] = (window.__messageLog.counts[id] || 0) + 1;

          if (data.type === 'safepay-property-update') {
            window.__messageLog.lastProps = data.properties;
            window.__messageLog.lastPropMessageId = id;
          }

          if (data.messageId && window.__messageLog.autoAck) {
            sendEvent('safepay-inframe__ack', { messageId: data.messageId, status: 'ok' });
          }

          sendEvent('safepay-inframe__messages-processed');
        });
      })();
    </script>
  </body>
</html>
`;

test.describe('Safepay Atoms messaging to drops', () => {
  test('host renders atoms and registers elements', async ({ page }) => {
    await renderHost(page);

    await page.waitForFunction(() => (window as any).__atomsHostReady === true);

    await expect(page.locator('safepay-card-atom')).toHaveCount(1);
    await expect(page.locator('safepay-payer-auth-atom')).toHaveCount(1);

    const isCardAtomRegistered = await page.evaluate(
      () => typeof customElements.get('safepay-card-atom') === 'function'
    );
    const isPayerAtomRegistered = await page.evaluate(
      () => typeof customElements.get('safepay-payer-auth-atom') === 'function'
    );

    expect(isCardAtomRegistered).toBe(true);
    expect(isPayerAtomRegistered).toBe(true);
  });

  test('passes config to drops and does not retry after ack', async ({ page }) => {
    test.skip(useRealDrops, 'Runs only with mocked drops');

    const tracker = 'trk_e2e';
    const authToken = 'secret_e2e';
    const user = 'user_e2e';

    const fulfillMock = async (route: any) => {
      const url = route.request().url();
      const label = url.includes('authlink') ? 'authlink' : 'cardlink';
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage(label),
      });
    };

    await page.route('**/cardlink*', fulfillMock);
    await page.route('**/authlink*', fulfillMock);

    await renderHost(page);

    await page.evaluate(({ tracker, authToken, user }) => {
      const { cardAtom, payerAuthAtom } = (window as any).__atomsHost;

      cardAtom.environment = 'sandbox';
      cardAtom.authToken = authToken;
      cardAtom.tracker = tracker;

      payerAuthAtom.environment = 'sandbox';
      payerAuthAtom.authToken = authToken;
      payerAuthAtom.tracker = tracker;
      payerAuthAtom.user = user;
    }, { tracker, authToken, user });

    await page.waitForSelector('iframe[src*="/drops/cardlink"]', { state: 'attached' });
    await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });

    const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
    const authFrame = await waitForFrameUrl(page, '/drops/authlink');

    await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));
    await authFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    const cardProps = await cardFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return {
        lastProps: log.lastProps,
        lastPropMessageId: log.lastPropMessageId,
        counts: log.counts,
        parentOrigin: log.parentOrigin,
      };
    });

    const authProps = await authFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return {
        lastProps: log.lastProps,
        lastPropMessageId: log.lastPropMessageId,
        counts: log.counts,
        parentOrigin: log.parentOrigin,
      };
    });

    expect(cardProps.lastProps).toMatchObject({
      environment: 'sandbox',
      tracker,
      authToken,
      validationEvent: 'submit',
    });

    expect(authProps.lastProps).toMatchObject({
      environment: 'sandbox',
      tracker,
      authToken,
      user,
    });
    expect(cardProps.parentOrigin).toBe('http://localhost:4173');
    expect(authProps.parentOrigin).toBe('http://localhost:4173');

    await page.waitForTimeout(1200);

    const cardCounts = await cardFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return { lastId: log.lastPropMessageId, counts: log.counts };
    });

    const authCounts = await authFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return { lastId: log.lastPropMessageId, counts: log.counts };
    });

    expect(cardCounts.counts[cardCounts.lastId]).toBe(1);
    expect(authCounts.counts[authCounts.lastId]).toBe(1);
  });

  test('retries property update when drops does not ack', async ({ page }) => {
    test.skip(useRealDrops, 'Runs only with mocked drops');

    const tracker = 'trk_retry';
    const authToken = 'secret_retry';
    const user = 'user_retry';

    const fulfillMock = async (route: any) => {
      const url = route.request().url();
      const label = url.includes('authlink') ? 'authlink' : 'cardlink';
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage(label, { autoAck: false }),
      });
    };

    await page.route('**/cardlink*', fulfillMock);
    await page.route('**/authlink*', fulfillMock);

    await renderHost(page);

    await page.evaluate(({ tracker, authToken, user }) => {
      const { cardAtom, payerAuthAtom } = (window as any).__atomsHost;

      cardAtom.environment = 'sandbox';
      cardAtom.authToken = authToken;
      cardAtom.tracker = tracker;

      payerAuthAtom.environment = 'sandbox';
      payerAuthAtom.authToken = authToken;
      payerAuthAtom.tracker = tracker;
      payerAuthAtom.user = user;
    }, { tracker, authToken, user });

    await page.waitForSelector('iframe[src*="/drops/cardlink"]', { state: 'attached' });
    await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });

    const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
    const authFrame = await waitForFrameUrl(page, '/drops/authlink');

    await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));
    await authFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    await page.waitForTimeout(2500);

    const cardCounts = await cardFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return { lastId: log.lastPropMessageId, counts: log.counts };
    });
    const authCounts = await authFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return { lastId: log.lastPropMessageId, counts: log.counts };
    });

    expect(cardCounts.counts[cardCounts.lastId]).toBeGreaterThanOrEqual(3);
    expect(authCounts.counts[authCounts.lastId]).toBeGreaterThanOrEqual(3);
  });

  test('handles drops events and toggles modal on proceed/success', async ({ page }) => {
    test.skip(useRealDrops, 'Runs only with mocked drops');

    await page.route('**/cardlink*', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage('cardlink'),
      })
    );
    await page.route('**/authlink*', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage('authlink'),
      })
    );

    await renderHost(page);

    await page.waitForSelector('iframe[src*="/drops/cardlink"]', { state: 'attached' });
    await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });

    const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
    const authFrame = await waitForFrameUrl(page, '/drops/authlink');

    await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));
    await authFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    await cardFrame.evaluate(() => {
      const parentOrigin = new URL(
        new URL(window.location.href).searchParams.get('parentOrigin') || document.referrer
      ).origin;

      window.parent.postMessage(
        {
          type: 'safepay-inframe-event',
          name: 'safepay-inframe__proceed__authentication',
          detail: {
            accessToken: 'ddc_token',
            deviceDataCollectionURL: 'https://example.test/ddc',
          },
        },
        parentOrigin
      );
    });

    await expect(page.locator('#threeds-modal')).toHaveClass(/show/);

    const payerAuthData = await page.evaluate(() => {
      const payerAuthAtom = document.querySelector('safepay-payer-auth-atom') as any;
      return {
        deviceDataCollectionJWT: payerAuthAtom.deviceDataCollectionJWT,
        deviceDataCollectionURL: payerAuthAtom.deviceDataCollectionURL,
      };
    });

    expect(payerAuthData).toEqual({
      deviceDataCollectionJWT: 'ddc_token',
      deviceDataCollectionURL: 'https://example.test/ddc',
    });

    await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });
    const authFrameLatest = page.frame({ url: /\/drops\/authlink/ });
    if (!authFrameLatest) throw new Error('authlink frame not found after proceed event');

    await authFrameLatest.evaluate(() => {
      const parentOrigin = new URL(
        new URL(window.location.href).searchParams.get('parentOrigin') || document.referrer
      ).origin;

      window.parent.postMessage(
        {
          type: 'safepay-inframe-event',
          name: 'safepay-inframe__cardinal-3ds__success',
          detail: { status: 'ok' },
        },
        parentOrigin
      );
    });

    await expect(page.locator('#threeds-modal')).toHaveClass(/hide/);
  });

  for (const c of DECLINE_CASES) {
    test(c.title, async ({ page }) => {
      test.skip(useRealDrops, 'Runs only with mocked drops');

      await page.route('**/cardlink*', async (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: createMockDropsPage('cardlink') })
      );
      await page.route('**/authlink*', async (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: createMockDropsPage('authlink') })
      );

      await renderHost(page, { declinedHandler: c.declinedHandler });

      await page.waitForSelector('iframe[src*="/drops/cardlink"]', { state: 'attached' });
      await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });

      const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
      await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

      await sendDeclineFromMockedDrops(page, c);
      await expectOnlyCallback(page, c, { timeout: 5_000, settleMs: MOCK_SETTLE_MS });
    });
  }

  test('rejects inframe events from unexpected origins', async ({ page }) => {
    test.skip(useRealDrops, 'Runs only with mocked drops');

    await page.route('**/cardlink*', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage('cardlink'),
      })
    );
    await page.route('**/authlink*', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage('authlink'),
      })
    );

    await renderHost(page);

    await page.waitForSelector('iframe[src*="/drops/cardlink"]', { state: 'attached' });
    await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });

    const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
    const authFrame = await waitForFrameUrl(page, '/drops/authlink');

    await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));
    await authFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    await page.evaluate(() => {
      const attacker = document.createElement('iframe');
      attacker.srcdoc = `
        <!doctype html>
        <html>
          <body>
            <script>
              window.parent.__maliciousFrameSent = true;
              window.parent.postMessage(
                {
                  type: 'safepay-inframe-event',
                  name: 'safepay-inframe__proceed__authentication',
                  detail: {
                    accessToken: 'evil_token',
                    deviceDataCollectionURL: 'https://evil.test/ddc',
                  },
                },
                window.parent.location.origin
              );
            <\/script>
          </body>
        </html>
      `;
      document.body.appendChild(attacker);
    });

    await page.waitForFunction(() => (window as any).__maliciousFrameSent === true);
    await page.waitForTimeout(250);

    await expect(page.locator('#threeds-modal')).toHaveClass(/hide/);

    const payerAuthData = await page.evaluate(() => {
      const payerAuthAtom = document.querySelector('safepay-payer-auth-atom') as any;
      return {
        deviceDataCollectionJWT: payerAuthAtom.deviceDataCollectionJWT ?? null,
        deviceDataCollectionURL: payerAuthAtom.deviceDataCollectionURL ?? null,
      };
    });

    expect(payerAuthData).toEqual({
      deviceDataCollectionJWT: null,
      deviceDataCollectionURL: null,
    });
  });

});


test.describe('Safepay Atoms HTML attributes', () => {
  // Browsers lowercase attribute names, so attributes must be observed in
  // kebab-case. This configures both elements purely through HTML attributes
  // (no JS properties) and checks every value reaches its property.
  test('configures both elements from kebab-case HTML attributes', async ({ page }) => {
    await page.goto('http://localhost:4173');
    await page.setContent(`
<!doctype html>
<html>
  <head>
    <script src="http://localhost:4173/dist/components/index.global.js"></script>
  </head>
  <body>
    <safepay-card-atom
      environment="sandbox"
      auth-token="tok_card"
      tracker="trk_card"
      validation-event="change"
      promo-code="SAVE10"
    ></safepay-card-atom>
    <safepay-payer-auth-atom
      environment="sandbox"
      auth-token="tok_auth"
      tracker="trk_auth"
      user="usr_1"
      device-data-collection-jwt="ddc_jwt"
      device-data-collection-url="https://ddc.example.com/collect"
    ></safepay-payer-auth-atom>
  </body>
</html>`);

    await page.waitForFunction(() =>
      Boolean(customElements.get('safepay-card-atom') && customElements.get('safepay-payer-auth-atom'))
    );

    const readProps = () =>
      page.evaluate(() => {
        const card = document.querySelector('safepay-card-atom') as any;
        const auth = document.querySelector('safepay-payer-auth-atom') as any;
        return {
          card: {
            environment: card.environment,
            authToken: card.authToken,
            tracker: card.tracker,
            validationEvent: card.validationEvent,
            promoCode: card.promoCode,
          },
          auth: {
            environment: auth.environment,
            authToken: auth.authToken,
            tracker: auth.tracker,
            user: auth.user,
            deviceDataCollectionJWT: auth.deviceDataCollectionJWT,
            deviceDataCollectionURL: auth.deviceDataCollectionURL,
          },
        };
      });

    expect(await readProps()).toEqual({
      card: {
        environment: 'sandbox',
        authToken: 'tok_card',
        tracker: 'trk_card',
        validationEvent: 'change',
        promoCode: 'SAVE10',
      },
      auth: {
        environment: 'sandbox',
        authToken: 'tok_auth',
        tracker: 'trk_auth',
        user: 'usr_1',
        deviceDataCollectionJWT: 'ddc_jwt',
        deviceDataCollectionURL: 'https://ddc.example.com/collect',
      },
    });

    // Changing an attribute after the element is connected updates the property.
    await page.evaluate(() => {
      document.querySelector('safepay-card-atom')!.setAttribute('promo-code', 'SAVE20');
      document.querySelector('safepay-payer-auth-atom')!.setAttribute('auth-token', 'tok_auth_2');
    });
    const updated = await readProps();
    expect(updated.card.promoCode).toBe('SAVE20');
    expect(updated.auth.authToken).toBe('tok_auth_2');
  });
});

// Points both atoms at a live tracker, enters the card and submits it.
const submitLiveCard = async (page: Page, session: LiveSession, tracker: string, card: TestCard) => {
  await page.evaluate(
    ({ authToken, tracker, user, env }) => {
      const { cardAtom, payerAuthAtom } = (window as any).__atomsHost;

      cardAtom.environment = env;
      cardAtom.authToken = authToken;
      cardAtom.tracker = tracker;

      payerAuthAtom.environment = env;
      payerAuthAtom.authToken = authToken;
      payerAuthAtom.tracker = tracker;
      payerAuthAtom.user = user;
    },
    { authToken: session.authToken, tracker, user: session.user, env: session.env }
  );

  const cardFrame = await waitForFrameUrl(page, 'cardlink');
  await cardFrame.waitForLoadState('domcontentloaded');

  await cardFrame.getByPlaceholder(/Card number/i).fill(card.number);
  await cardFrame.getByPlaceholder(/^MM$/i).fill(card.expiry.mm);
  await cardFrame.getByPlaceholder(/^YY$/i).fill(card.expiry.yy);
  await cardFrame.getByPlaceholder(/CVV/i).fill(card.cvv);

  await page.evaluate(() => (window as any).__atomsHost.cardAtom.submit());
};

// Waits for the step-up challenge and answers it with the Cardinal test code.
const completeLiveChallenge = async (page: Page) => {
  await page.waitForFunction(
    () => Boolean((window as any).__atomsCallbacks.proceedToAuthentication),
    { timeout: 20_000 }
  );
  await expect(page.locator('#threeds-modal')).toHaveClass(/show/);

  // Drops contains the step-up challenge in a nested iframe that loads
  // Cardinal's step-up page, which renders the ACS iframe with the form.
  const challengeFrame = page
    .frameLocator('iframe').nth(1)                  // payer auth iframe
    .frameLocator('#threeds_challenge_iframe')      // Cardinal step-up page
    .frameLocator('iframe');                        // ACS challenge iframe inside Cardinal

  await challengeFrame.getByPlaceholder('Enter Code Here').waitFor({ state: 'visible', timeout: 60_000 });
  await challengeFrame.getByPlaceholder('Enter Code Here').fill('1234');
  await challengeFrame.getByRole('button', { name: 'SUBMIT' }).click();
};

const waitForCallback = (page: Page, name: string, timeout: number) =>
  page.waitForFunction((name) => Boolean((window as any).__atomsCallbacks[name]), name, { timeout });

test.describe(`live regression against ${dropsEnv} drops`, () => {
  test.skip(!useRealDrops, 'Opt-in: set USE_REAL_DROPS=1 and X_SFPY_MERCHANT_SECRET to run against a live backend');

  let session: LiveSession;

  test.beforeAll(async () => {
    session = await createLiveSession();
  });

  for (const card of REGRESSION_CARDS) {
    test(`${card.scenario}: ${card.description}`, async ({ page }) => {
      if (card.flow === 'step-up') test.setTimeout(120_000);

      const tracker = await createTracker(session);

      await renderHost(page);
      await submitLiveCard(page, session, tracker, card);

      if (card.flow === 'frictionless') {
        // A rejected frictionless authentication: drops fires enrollment__failed,
        // which atoms routes to onPayerAuthenticationUnavailable
        await waitForCallback(page, card.outcome === 'proceed' ? 'frictionless' : 'unavailable', 20_000);
      } else {
        await completeLiveChallenge(page);
        await waitForCallback(page, card.outcome === 'proceed' ? 'success' : 'failure', 30_000);
      }
    });
  }
});

// Authentication succeeds, then the issuer declines the authorization with
// response code 51 (insufficient funds).
test.describe(`live declines against ${dropsEnv} drops`, () => {
  test.skip(!useRealDrops, 'Opt-in: set USE_REAL_DROPS=1 and X_SFPY_MERCHANT_SECRET to run against a live backend');

  let session: LiveSession;

  test.beforeAll(async () => {
    session = await createLiveSession();
  });

  for (const c of DECLINE_CASES) {
    test(c.title, async ({ page }) => {
      test.fixme(needsNewerDrops(c), NEEDS_NEWER_DROPS_REASON);
      if (c.flow === 'step-up') test.setTimeout(120_000);

      const tracker = await createTracker(session, { amount: INSUFFICIENT_FUNDS_AMOUNT });

      await renderHost(page, { declinedHandler: c.declinedHandler });
      await submitLiveCard(page, session, tracker, LIVE_DECLINE_CARDS[c.flow]);
      if (c.flow === 'step-up') await completeLiveChallenge(page);

      await expectOnlyCallback(page, c, { timeout: 30_000, settleMs: LIVE_SETTLE_MS, tracker });
    });
  }
});
