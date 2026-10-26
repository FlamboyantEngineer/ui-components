import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.LABS_PORT ?? 4173);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Lab assertions retry; a generous timeout keeps them stable on a busy machine.
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node scripts/serve-labs.mjs --port ${port}`,
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
