import { defineConfig, devices } from '@playwright/test';

const projects = [
  {
    name: 'atoms',
    testMatch: /atoms\.spec\.ts/,
    use: {
      baseURL: 'http://localhost:4173',
      ...devices['Desktop Chrome'],
    },
  },
];

if (process.env.RUN_DROPS) {
  projects.push({
    name: 'drops',
    testMatch: /drops\.spec\.ts/,
    use: {
      baseURL: 'http://localhost:5173',
      ...devices['Desktop Chrome'],
    },
  });
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'pnpm run build && pnpm exec serve . --listen 4173 --no-request-logging --no-clipboard',
    url: 'http://localhost:4173/examples/card-links-demo.html',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects,
});
