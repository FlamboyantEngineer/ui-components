// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-references.mjs');
const dirs: string[] = [];

function scan(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-references-'));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return spawnSync(process.execPath, [script, '--dir', dir], { encoding: 'utf8' });
}

// Assemble probe terms at runtime so this file never contains them literally.
const word = (...parts: string[]) => parts.join('');

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('no-reference check', () => {
  it('passes neutral content', () => {
    const result = scan({
      'button.tsx': 'export const label = "Save";\n',
      'README.md': '# Button\n',
    });
    expect(result.status).toBe(0);
  });

  it.each([
    ['the host name in code', 'probe.ts', `// ${word('Flight', 'Spec')} button\n`],
    ['the host name in docs', 'README.md', `Used by ${word('flight', 'spec')}.\n`],
    ['a host class prefix', 'probe.tsx', `const c = "${word('f', 's-')}button";\n`],
    ['a host domain term', 'probe.md', `Opens the ${word('arti', 'fact')} picker.\n`],
    ['a host requirement ID', 'probe.md', `Replaces ${word('PT', '-BTN-', '1.2')}.\n`],
  ])('fails on %s', (_label, name, text) => {
    const result = scan({ [name]: text });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(name);
  });

  it('fails on a host term in a file path', () => {
    const result = scan({ [`${word('arti', 'fact')}-list.ts`]: 'export {};\n' });
    expect(result.status).toBe(1);
  });

  it('allows library requirement IDs and license identifiers', () => {
    const result = scan({ 'SPEC.md': 'UIC-BUTTON-1.2, UIC-ICON-LABEL-1.2 and CC-BY-4.0\n' });
    expect(result.status).toBe(0);
  });
});
