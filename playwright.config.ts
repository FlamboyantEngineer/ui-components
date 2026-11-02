import { defineConfig, devices } from '@playwright/test';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { LABS_HOST, LABS_PORT } from './scripts/lib/labs.mjs';

const origin = `http://${String(LABS_HOST)}:${String(LABS_PORT)}`;

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
    baseURL: `${origin}/`,
    // Recording a trace for every test costs about a sixth of the run, and CI keeps no files from a
    // run, so no run records one; rerun a failing test with `--trace=on`.
    trace: 'off',
  },
  webServer: {
    command: 'node scripts/serve-labs.mjs',
    url: `${origin}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Layout that leans on newer CSS also runs in WebKit.
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /steps-narrow\.spec\.ts$/ },
    // Dock panel geometry leans on writing modes and pointer capture, and tree section rows on
    // React Aria's row groups, and the rich composer's ranges on its own selection model, which
    // Firefox draws and edits its own way.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /(dock-panel|tree-sections|message-composer-ranges)\.spec\.ts$/,
    },
    // Focus scrolling that only phones show runs in mobile WebKit.
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
      testMatch: /modal-tall-form\.spec\.ts$/,
    },
  ],
});
