import { expect, test, Page, Frame } from '@playwright/test';

const useRealDrops = process.env.USE_REAL_DROPS === '1';
const dropsEnv = (process.env.DROPS_ENV || 'sandbox').toLowerCase();
const dropsBaseByEnv: Record<string, string> = {
  sandbox: 'https://sandbox.api.getsafepay.com/drops',
  development: 'https://dev.api.getsafepay.com/drops',
  production: 'https://getsafepay.com/drops',
  local: 'http://127.0.0.1:3000',
};
const dropsBase = process.env.DROPS_BASE || dropsBaseByEnv[dropsEnv] || dropsBaseByEnv.sandbox;

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
          };

          payerAuthAtom.onPayerAuthenticationSuccess = function () {
            modal.classList.remove('show');
            modal.classList.add('hide');
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
        const sendEvent = (name, detail) => {
          window.parent.postMessage({ type: 'safepay-inframe-event', name, detail }, '*');
        };

        window.__messageLog = {
          received: [],
          counts: {},
          lastProps: null,
          lastPropMessageId: null,
          autoAck: ${options?.autoAck ?? true},
        };

        sendEvent('safepay-inframe__ready');

        window.addEventListener('message', (event) => {
          const data = event.data || {};
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

    await page.route('**/drops/cardlink', fulfillMock);
    await page.route('**/drops/authlink', fulfillMock);

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
      return { lastProps: log.lastProps, lastPropMessageId: log.lastPropMessageId, counts: log.counts };
    });

    const authProps = await authFrame.evaluate(() => {
      const log = (window as any).__messageLog;
      return { lastProps: log.lastProps, lastPropMessageId: log.lastPropMessageId, counts: log.counts };
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

    await page.route('**/drops/cardlink', fulfillMock);
    await page.route('**/drops/authlink', fulfillMock);

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

    await page.route('**/drops/cardlink', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: createMockDropsPage('cardlink'),
      })
    );
    await page.route('**/drops/authlink', async (route) =>
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
      window.parent.postMessage(
        {
          type: 'safepay-inframe-event',
          name: 'safepay-inframe__proceed__authentication',
          detail: {
            accessToken: 'ddc_token',
            deviceDataCollectionURL: 'https://example.test/ddc',
          },
        },
        '*'
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
      window.parent.postMessage(
        {
          type: 'safepay-inframe-event',
          name: 'safepay-inframe__cardinal-3ds__success',
          detail: { status: 'ok' },
        },
        '*'
      );
    });

    await expect(page.locator('#threeds-modal')).toHaveClass(/hide/);
  });

  test('opt-in: happy path typing against live drops', async ({ page }) => {
    test.skip(!useRealDrops, 'Opt-in: set USE_REAL_DROPS=1 with a reachable drops instance');

    await renderHost(page);

    const tracker = process.env.DROPS_TRACKER || 'tracker_live';
    const authToken = process.env.DROPS_AUTH_TOKEN || 'secret_live';
    const user = process.env.DROPS_USER || '';
    const env = dropsEnv;

    await page.evaluate(
      ({ tracker, authToken, user, env }) => {
        const { cardAtom, payerAuthAtom } = (window as any).__atomsHost;

        cardAtom.environment = env;
        cardAtom.authToken = authToken;
        cardAtom.tracker = tracker;

        payerAuthAtom.environment = env;
        payerAuthAtom.authToken = authToken;
        payerAuthAtom.tracker = tracker;
        payerAuthAtom.user = user;
      },
      { tracker, authToken, user, env }
    );

    const cardFrame = await waitForFrameUrl(page, 'cardlink');
    await cardFrame.waitForLoadState('domcontentloaded');

    await cardFrame.getByPlaceholder(/Card number/i).fill('4242424242424242');
    await cardFrame.getByPlaceholder(/^MM$/i).fill('12');
    await cardFrame.getByPlaceholder(/^YY$/i).fill('34');
    await cardFrame.getByPlaceholder(/CVV/i).fill('123');

    await cardFrame.waitForTimeout(500);
  });

  test('opt-in: records live drops requests', async ({ page }) => {
    test.skip(!useRealDrops, 'Opt-in: set USE_REAL_DROPS=1 to run against live drops');

    const tracker = process.env.DROPS_TRACKER || 'tracker_live';
    const authToken = process.env.DROPS_AUTH_TOKEN || 'secret_live';
    const user = process.env.DROPS_USER || '';

    const requests: { url: string; method: string }[] = [];
    page.context().on('request', (req) => {
      const url = req.url();
      if (url.includes('/cardlink') || url.includes('/authlink')) {
        requests.push({ url, method: req.method() });
      }
    });

    await renderHost(page);

    const atomsAvailable = await page.evaluate(() => Boolean((window as any).atoms));
    if (!atomsAvailable) {
      throw new Error('window.atoms is not available; components script may not have loaded');
    }

    await page.evaluate(
      ({ tracker, authToken, user, env }) => {
        const { cardAtom, payerAuthAtom } = (window as any).__atomsHost;

        cardAtom.setAttribute('environment', env);
        cardAtom.setAttribute('auth-token', authToken);
        cardAtom.setAttribute('tracker', tracker);
        cardAtom.environment = env;
        cardAtom.authToken = authToken;
        cardAtom.tracker = tracker;

        payerAuthAtom.setAttribute('environment', env);
        payerAuthAtom.setAttribute('auth-token', authToken);
        payerAuthAtom.setAttribute('tracker', tracker);
        payerAuthAtom.setAttribute('user', user);
        payerAuthAtom.environment = env;
        payerAuthAtom.authToken = authToken;
        payerAuthAtom.tracker = tracker;
        payerAuthAtom.user = user;
      },
      { tracker, authToken, user, env: dropsEnv }
    );

    await expect.poll(() => requests.filter((r) => r.url.includes('cardlink')).length, {
      timeout: 10000,
    }).toBeGreaterThan(0);
    await expect.poll(() => requests.filter((r) => r.url.includes('authlink')).length, {
      timeout: 10000,
    }).toBeGreaterThan(0);

    const frameUrls = page.frames().map((f) => f.url());
    test.info().annotations.push({ type: 'frames', description: frameUrls.join(', ') });
  });
});
