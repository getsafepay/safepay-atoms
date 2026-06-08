import { expect, test, Page, Frame } from '@playwright/test';
import { createLiveSession, createTracker, LiveSession } from './live-session';
import { REGRESSION_CARDS } from './test-cards';

const useRealDrops = process.env.USE_REAL_DROPS === '1';
const dropsEnv = (process.env.DROPS_ENV || 'sandbox').toLowerCase();

const waitForFrameUrl = async (page: Page, substring: string): Promise<Frame> => {
  const existing = page.frames().find((f) => f.url().includes(substring) && f.url() !== 'about:blank');
  if (existing) return existing;
  const navigated = page.waitForEvent('framenavigated', (f) => f.url().includes(substring));
  const attached = page.waitForEvent('frameattached', (f) => f.url().includes(substring));
  return Promise.race([navigated, attached]);
};

const createMockDropsPage = (label: string) => `
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
          } catch { return null; }
        };
        const parentOrigin =
          resolveExactOrigin(new URL(window.location.href).searchParams.get('parentOrigin')) ||
          resolveExactOrigin(document.referrer);
        const sendEvent = (name, detail) => {
          if (!parentOrigin) return;
          window.parent.postMessage({ type: 'safepay-inframe-event', name, detail }, parentOrigin);
        };
        window.__messageLog = { received: [], counts: {}, lastProps: null, lastPropMessageId: null, parentOrigin };
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
          if (data.messageId) {
            sendEvent('safepay-inframe__ack', { messageId: data.messageId, status: 'ok' });
          }
          sendEvent('safepay-inframe__messages-processed');
        });
      })();
    </script>
  </body>
</html>`;

const renderHost = async (page: Page) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__reactHostReady === true);
};

test.describe('Safepay React components (CardCapture + PayerAuthentication)', () => {
  test('renders components and creates iframes when credentials are set', async ({ page }) => {
    await renderHost(page);

    await page.evaluate(() => {
      (window as any).__reactHost.setCardProps({ environment: 'sandbox', authToken: 'tok', tracker: 'trk' });
      (window as any).__reactHost.setPayerAuthProps({ environment: 'sandbox', authToken: 'tok', tracker: 'trk', user: '' });
    });

    await expect(page.locator('iframe[src*="/drops/cardlink"]')).toHaveCount(1);
    await expect(page.locator('iframe[src*="/drops/authlink"]')).toHaveCount(1);
  });

  test('passes updated props to drops iframes', async ({ page }) => {
    test.skip(useRealDrops, 'Runs only with mocked drops');

    const tracker = 'trk_react';
    const authToken = 'secret_react';
    const user = 'user_react';

    const fulfillMock = async (route: any) => {
      const url = route.request().url();
      await route.fulfill({
        status: 200, contentType: 'text/html',
        body: createMockDropsPage(url.includes('authlink') ? 'authlink' : 'cardlink'),
      });
    };
    await page.route('**/cardlink*', fulfillMock);
    await page.route('**/authlink*', fulfillMock);

    await renderHost(page);

    await page.evaluate(
      ({ tracker, authToken, user }) => {
        (window as any).__reactHost.setCardProps({ environment: 'sandbox', authToken, tracker });
        (window as any).__reactHost.setPayerAuthProps({ environment: 'sandbox', authToken, tracker, user });
      },
      { tracker, authToken, user }
    );

    await page.waitForSelector('iframe[src*="/drops/cardlink"]', { state: 'attached' });
    await page.waitForSelector('iframe[src*="/drops/authlink"]', { state: 'attached' });

    const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
    const authFrame = await waitForFrameUrl(page, '/drops/authlink');

    await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));
    await authFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    const cardProps = await cardFrame.evaluate(() => (window as any).__messageLog.lastProps);
    const authProps = await authFrame.evaluate(() => (window as any).__messageLog.lastProps);

    expect(cardProps).toMatchObject({ environment: 'sandbox', tracker, authToken, validationEvent: 'submit' });
    expect(authProps).toMatchObject({ environment: 'sandbox', tracker, authToken, user });
  });

  test('onProceedToAuthentication callback fires and modal shows', async ({ page }) => {
    test.skip(useRealDrops, 'Runs only with mocked drops');

    await page.route('**/cardlink*', async (r) =>
      r.fulfill({ status: 200, contentType: 'text/html', body: createMockDropsPage('cardlink') })
    );
    await page.route('**/authlink*', async (r) =>
      r.fulfill({ status: 200, contentType: 'text/html', body: createMockDropsPage('authlink') })
    );

    await renderHost(page);

    await page.evaluate(() => {
      (window as any).__reactHost.setCardProps({ environment: 'sandbox', authToken: 'tok', tracker: 'trk' });
      (window as any).__reactHost.setPayerAuthProps({ environment: 'sandbox', authToken: 'tok', tracker: 'trk', user: '' });
    });

    const cardFrame = await waitForFrameUrl(page, '/drops/cardlink');
    await cardFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    await cardFrame.evaluate(() => {
      const parentOrigin = new URL(
        new URL(window.location.href).searchParams.get('parentOrigin') || document.referrer
      ).origin;
      window.parent.postMessage(
        { type: 'safepay-inframe-event', name: 'safepay-inframe__proceed__authentication',
          detail: { accessToken: 'ddc_token', deviceDataCollectionURL: 'https://example.test/ddc' } },
        parentOrigin
      );
    });

    await expect(page.locator('#threeds-modal')).toHaveClass(/show/);
    await page.waitForFunction(() => Boolean((window as any).__atomsCallbacks.proceedToAuthentication));

    const authFrame = page.frame({ url: /\/drops\/authlink/ });
    if (!authFrame) throw new Error('authlink frame not found');
    await authFrame.waitForFunction(() => Boolean((window as any).__messageLog?.lastPropMessageId));

    const authProps = await authFrame.evaluate(() => (window as any).__messageLog.lastProps);
    expect(authProps?.deviceDataCollectionJWT).toBe('ddc_token');
    expect(authProps?.deviceDataCollectionURL).toBe('https://example.test/ddc');

    await authFrame.evaluate(() => {
      const parentOrigin = new URL(
        new URL(window.location.href).searchParams.get('parentOrigin') || document.referrer
      ).origin;
      window.parent.postMessage(
        { type: 'safepay-inframe-event', name: 'safepay-inframe__cardinal-3ds__success', detail: { status: 'ok' } },
        parentOrigin
      );
    });

    await expect(page.locator('#threeds-modal')).toHaveClass(/hide/);
    await page.waitForFunction(() => Boolean((window as any).__atomsCallbacks.success));
  });
});

test.describe(`live regression against ${dropsEnv} drops (React components)`, () => {
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

      await page.evaluate(
        ({ authToken, tracker, user, env }) => {
          (window as any).__reactHost.setCardProps({ environment: env, authToken, tracker });
          (window as any).__reactHost.setPayerAuthProps({ environment: env, authToken, tracker, user });
        },
        { authToken: session.authToken, tracker, user: session.user, env: session.env }
      );

      const cardFrame = await waitForFrameUrl(page, 'cardlink');
      await cardFrame.waitForLoadState('domcontentloaded');

      await cardFrame.getByPlaceholder(/Card number/i).fill(card.number);
      await cardFrame.getByPlaceholder(/^MM$/i).fill(card.expiry.mm);
      await cardFrame.getByPlaceholder(/^YY$/i).fill(card.expiry.yy);
      await cardFrame.getByPlaceholder(/CVV/i).fill(card.cvv);

      await page.evaluate(() => (window as any).__reactHost.submitCard());

      if (card.flow === 'frictionless') {
        if (card.outcome === 'proceed') {
          await page.waitForFunction(
            () => Boolean((window as any).__atomsCallbacks.frictionless),
            { timeout: 20_000 }
          );
        } else {
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

        const challengeFrame = page
          .frameLocator('iframe').nth(1)
          .frameLocator('iframe');

        await challengeFrame.getByPlaceholder('Enter Code Here').waitFor({ state: 'visible', timeout: 60_000 });
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
