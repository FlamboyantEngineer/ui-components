// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

const fixtures: string[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

it('UIC-PRIMITIVES-2.1 preserves large failure output and stops before the next check stage', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'ui-check-test-'));
  fixtures.push(fixture);
  mkdirSync(join(fixture, 'scripts/lib'), { recursive: true });
  copyFileSync(join(process.cwd(), 'scripts/check.mjs'), join(fixture, 'scripts/check.mjs'));
  writeFileSync(
    join(fixture, 'scripts/lib/npm.mjs'),
    `import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
export function startNpm(args, options) {
  const script = args.at(-1);
  if (script === 'test') writeFileSync('second-stage-started', 'yes');
  const source = script === 'lint'
    ? 'process.stdout.write("x".repeat(2_000_000)); console.log("FAILURE_DETAILS_AT_END"); process.exitCode = 1;'
    : '';
  return spawn(process.execPath, ['-e', source], options);
}
`,
  );

  const result = spawnSync(process.execPath, [join(fixture, 'scripts/check.mjs')], {
    cwd: fixture,
    encoding: 'utf8',
    maxBuffer: 4_000_000,
  });
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('FAILED (exit 1)  lint');
  expect(result.stdout).toContain('FAILURE_DETAILS_AT_END');
  expect(result.stdout).toContain('lint failed.');
  expect(result.stdout).not.toContain('Every check passed.');
  expect(existsSync(join(fixture, 'second-stage-started'))).toBe(false);
});
