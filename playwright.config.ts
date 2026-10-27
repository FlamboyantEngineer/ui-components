import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.LABS_PORT ?? 4173);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // The suite is CPU-bound: one worker per core keeps every core busy.
  workers: '100%',
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Lab assertions retry; a generous timeout keeps them stable on a busy machine.
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    // Recording a trace for every test costs about a sixth of the run, so only CI keeps one for
    // each failure; locally, rerun a failing test with `--trace=on`.
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },
  webServer: {
    command: `node scripts/serve-labs.mjs --port ${port}`,
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Layout that leans on newer CSS also runs in WebKit.
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /steps-narrow\.spec\.ts$/ },
  ],
});
