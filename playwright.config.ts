import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'atoms',
      testMatch: /atoms\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:4173',
        ...devices['Desktop Chrome'],
      },
      webServer: {
        command: 'pnpm run build && pnpm exec serve . --listen 4173 --single',
        url: 'http://localhost:4173/examples/card-links-demo.html',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
    {
      name: 'drops',
      testMatch: /drops\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:5173',
        ...devices['Desktop Chrome'],
      },
      webServer: {
        command: 'pnpm --dir ../safepay-drops run dev -- --host --port 5173',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
  ],
});
