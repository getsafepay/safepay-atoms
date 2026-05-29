import { expect, test, Page, Frame } from '@playwright/test';
import { createLiveSession, createTracker, LiveSession } from './live-session';
import { REGRESSION_CARDS } from './test-cards';

const useRealDrops = process.env.USE_REAL_DROPS === '1';
const dropsEnv = (process.env.DROPS_ENV || 'sandbox').toLowerCase();

const waitForFrameUrl = async (page: Page, substring: string): Promise<Frame> => {
  const existing = page.frames().find((frame) => frame.url().includes(substring) && frame.url() !== 'about:blank');
  if (existing) return existing;

  const navigated = page.waitForEvent('framenavigated', (frame) => frame.url().includes(substring));
  const attached = page.waitForEvent('frameattached', (frame) => frame.url().includes(substring));
  return Promise.race([navigated, attached]);
};

const renderHost = async (page: Page) => {
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

          payerAuthAtom.onPayerAuthenticationSuccess = function (data) {
            modal.classList.remove('show');
            modal.classList.add('hide');
            window.__atomsCallbacks.success = data;
          };
          payerAuthAtom.onPayerAuthenticationFailure = function (data) {
            modal.classList.remove('show');
            modal.classList.add('hide');
            window.__atomsCallbacks.failure = data;
          };
          payerAuthAtom.onPayerAuthenticationFrictionless = function (data) {
            window.__atomsCallbacks.frictionless = data;
          };
          payerAuthAtom.onPayerAuthenticationUnavailable = function (data) {
            window.__atomsCallbacks.unavailable = data;
          };

          window.__atomsCallbacks = { proceedToAuthentication: null, success: null, failure: null, frictionless: null, unavailable: null };
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

test.describe(`live regression against ${dropsEnv} drops`, () => {
  test.skip(!useRealDrops, 'Opt-in: set USE_REAL_DROPS=1 and X_SFPY_MERCHANT_SECRET to run against a live backend');

  let session: LiveSession;

  test.beforeAll(async () => {
    session = await createLiveSession();
  });

  for (const card of REGRESSION_CARDS) {
    test(`${card.scenario}: ${card.description}`, async ({ page }) => {
      if (card.flow === 'step-up') test.setTimeout(90_000);

      const tracker = await createTracker(session);

      await renderHost(page);

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

      if (card.flow === 'frictionless') {
        if (card.outcome === 'proceed') {
          await page.waitForFunction(
            () => Boolean((window as any).__atomsCallbacks.frictionless),
            { timeout: 20_000 }
          );
        } else {
          // drops fires enrollment__failed → atoms routes to onPayerAuthenticationUnavailable
          await page.waitForFunction(
            () => Boolean((window as any).__atomsCallbacks.unavailable),
            { timeout: 20_000 }
          );
        }
      } else {
        await page.waitForFunction(
          () => Boolean((window as any).__atomsCallbacks.proceedToAuthentication),
          { timeout: 20_000 }
        );
        await expect(page.locator('#threeds-modal')).toHaveClass(/show/);

        // The authlink iframe navigates to Cardinal's step-up page, which renders
        // a nested ACS iframe containing the challenge form.
        const challengeFrame = page
          .frameLocator('iframe').nth(1)  // payer auth iframe (now at Cardinal's URL)
          .frameLocator('iframe');         // ACS challenge iframe inside Cardinal

        await challengeFrame.getByPlaceholder('Enter Code Here').fill('1234');
        await challengeFrame.getByRole('button', { name: 'SUBMIT' }).click();

        if (card.outcome === 'proceed') {
          await page.waitForFunction(
            () => Boolean((window as any).__atomsCallbacks.success),
            { timeout: 30_000 }
          );
        } else {
          await page.waitForFunction(
            () => Boolean((window as any).__atomsCallbacks.failure),
            { timeout: 30_000 }
          );
        }
      }
    });
  }
});
