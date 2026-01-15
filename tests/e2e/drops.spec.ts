import { expect, test } from '@playwright/test';

test.describe('Safepay Drops', () => {
  test('renders landing page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Card Capture for Safepay Drops' })).toBeVisible();
    await expect(
      page.getByText('This web app contains the iFramed content for Safepay Drops.', { exact: false })
    ).toBeVisible();
  });
});
