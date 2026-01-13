import { expect, test } from '@playwright/test';

test.describe('Safepay Atoms demo', () => {
  test('card demo loads and registers atoms', async ({ page }) => {
    await page.goto('/examples/card-links-demo.html');

    await expect(page).toHaveTitle(/Safepay Card Capture Demo/i);
    await expect(page.getByRole('heading', { name: 'Card Capture Atom' })).toBeVisible();

    const cardAtom = page.locator('safepay-card-atom');
    const payerAuthAtom = page.locator('safepay-payer-auth-atom');

    await expect(cardAtom).toHaveCount(1);
    await expect(payerAuthAtom).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    const isCardAtomRegistered = await page.evaluate(
      () => typeof customElements.get('safepay-card-atom') === 'function'
    );

    expect(isCardAtomRegistered).toBe(true);
  });
});
