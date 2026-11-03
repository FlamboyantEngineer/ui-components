// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import config from '../vitest.config.js';

const fixtures: string[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

/** Two files in one worker: a stale native observer must only see its original document. */
function createIsolationFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'ui-test-isolation-'));
  fixtures.push(fixture);
  symlinkSync(
    join(process.cwd(), 'node_modules'),
    join(fixture, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  copyFileSync(join(process.cwd(), 'test/setup.ts'), join(fixture, 'setup.ts'));
  writeFileSync(join(fixture, 'package.json'), '{"type":"module"}');
  writeFileSync(
    join(fixture, 'first.test.ts'),
    `
import { it } from 'vitest';
it('UIC-TESTING-4.1 leaves a native observer attached to its own document', () => {
  const body = document.body;
  const observer = new MutationObserver(() => body.setAttribute('aria-hidden', 'true'));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  body.append(document.createElement('div'));
});
`,
  );
  writeFileSync(
    join(fixture, 'second.test.ts'),
    `
import { it, expect } from 'vitest';
import { getByRole } from '@testing-library/dom';
it('UIC-TESTING-4.1 keeps the next file accessible to role queries', async () => {
  const button = document.body.appendChild(document.createElement('button'));
  button.textContent = 'Save';
  await Promise.resolve();
  expect(getByRole(document.body, 'button', { name: 'Save' })).toBe(button);
});
`,
  );
  writeFileSync(
    join(fixture, 'order.mjs'),
    `
import { BaseSequencer } from 'vitest/node';
export default class extends BaseSequencer {
  async sort(tests) { return tests.sort((a, b) => a.moduleId.localeCompare(b.moduleId)); }
}
`,
  );
  const settings = {
    root: fixture,
    test: {
      environment: 'jsdom',
      include: ['*.test.ts'],
      setupFiles: ['./setup.ts'],
      isolate: config.test?.isolate,
      maxWorkers: 1,
      fileParallelism: false,
    },
  };
  writeFileSync(
    join(fixture, 'vitest.config.mjs'),
    `
import Order from './order.mjs';
const config = ${JSON.stringify(settings)};
export default { ...config, test: { ...config.test, sequence: { sequencer: Order } } };
`,
  );
  return fixture;
}

it('UIC-TESTING-4.1 isolates each file from native observers left by the previous file', () => {
  const fixture = createIsolationFixture();
  const result = spawnSync(
    process.execPath,
    [
      join(process.cwd(), 'node_modules/vitest/vitest.mjs'),
      'run',
      '--config',
      join(fixture, 'vitest.config.mjs'),
    ],
    {
      cwd: fixture,
      encoding: 'utf8',
      timeout: 30_000,
    },
  );
  expect(result.stdout + result.stderr).toContain('2 passed');
  expect(result.status).toBe(0);
});
