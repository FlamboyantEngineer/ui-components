// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const dirs: string[] = [];

function requirement(id: string) {
  return [
    `### ${id} - Sample`,
    '',
    'Statement.',
    '',
    'Implementation: `src/sample.ts`',
    'Verification: `src/sample.test.ts`',
    '',
  ];
}

/** Runs the checker on one spec, in a scratch repository whose test names every ID. */
function check(headings: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-specs-'));
  dirs.push(dir);
  for (const sub of ['scripts', 'specs', 'src']) mkdirSync(join(dir, sub));
  copyFileSync(
    join(process.cwd(), 'scripts/check-specs.mjs'),
    join(dir, 'scripts/check-specs.mjs'),
  );
  const lines = ['# Sample', ''];
  for (const heading of headings) {
    lines.push(...(heading.startsWith('## ') ? [heading, ''] : requirement(heading)));
  }
  writeFileSync(join(dir, 'specs/SAMPLE.md'), lines.join('\n'));
  writeFileSync(join(dir, 'src/sample.ts'), '');
  writeFileSync(join(dir, 'src/sample.test.ts'), `// ${headings.join(' ')}\n`);
  return spawnSync('node', ['scripts/check-specs.mjs'], { cwd: dir, encoding: 'utf8' });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-specs', () => {
  it('accepts requirements numbered from 1 under ascending groups', () => {
    const result = check([
      '## UIC-SAMPLE-1 - First',
      'UIC-SAMPLE-1.1',
      'UIC-SAMPLE-1.2',
      '## UIC-SAMPLE-3 - Third',
      'UIC-SAMPLE-3.1',
    ]);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('rejects a requirement outside its group, a gap, a reordering and a descending group', () => {
    const result = check([
      '## UIC-SAMPLE-2 - Second',
      'UIC-SAMPLE-2.1',
      'UIC-SAMPLE-2.3',
      'UIC-SAMPLE-2.2',
      'UIC-SAMPLE-4.1',
      '## UIC-SAMPLE-1 - First',
      'UIC-SAMPLE-1.1',
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('UIC-SAMPLE-2.3 follows .1');
    expect(result.stderr).toContain('UIC-SAMPLE-2.2 follows .3');
    expect(result.stderr).toContain(
      'UIC-SAMPLE-4.1 is not under its group heading ## UIC-SAMPLE-4',
    );
    expect(result.stderr).toContain('group UIC-SAMPLE-1 comes after group 2');
  });
});
