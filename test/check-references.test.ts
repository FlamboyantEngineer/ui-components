// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-references.mjs');
const dirs: string[] = [];

function encode(source: string, flags = 'i') {
  return { source: Buffer.from(source).toString('base64'), flags };
}

// A made-up denylist, so the test exercises the scanner without naming any real term.
const sampleDenylist = [
  encode('forbidden[\\s_-]?word'),
  encode('(^|[^a-z0-9-])zz-'),
  encode('quux'),
];

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ui-references-'));
  dirs.push(dir);
  return dir;
}

function scan(files: Record<string, string>, denylist: 'sample' | 'repository' = 'sample') {
  const dir = tempDir();
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  const args = [script, '--dir', dir];
  if (denylist === 'sample') {
    const listFile = join(tempDir(), 'denylist.json');
    writeFileSync(listFile, JSON.stringify(sampleDenylist));
    args.push('--denylist', listFile);
  }
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('no-reference check', () => {
  it('UIC-LABS-1.2 accepts the original PDF runtime and rejects changed copies', () => {
    const dir = tempDir();
    const vendorDir = join(dir, 'labs/build/vendor');
    mkdirSync(vendorDir, { recursive: true });
    const resolvePackage = createRequire(import.meta.url).resolve;
    for (const file of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
      copyFileSync(resolvePackage(`pdfjs-dist/build/${file}`), join(vendorDir, file));
    }
    const args = [script, '--dir', dir];
    expect(spawnSync(process.execPath, args, { encoding: 'utf8' }).status).toBe(0);
    writeFileSync(join(vendorDir, 'pdf.min.mjs'), 'export {};\n');
    const changed = spawnSync(process.execPath, args, { encoding: 'utf8' });
    expect(changed.status).toBe(1);
    expect(changed.stderr).toContain('differs from the installed PDF runtime');
  });

  it('passes neutral content', () => {
    const result = scan({
      'button.tsx': 'export const label = "Save";\n',
      'README.md': '# Button\n',
    });
    expect(result.status).toBe(0);
  });

  it.each([
    ['a term in code', 'probe.ts', '// Forbidden Word button\n'],
    ['a term in docs', 'README.md', 'Used by forbidden-word.\n'],
    ['a class prefix', 'probe.tsx', 'const c = "zz-button";\n'],
    ['a domain term', 'probe.md', 'Opens the quux picker.\n'],
  ])('fails on %s', (_label, name, text) => {
    const result = scan({ [name]: text });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(name);
  });

  it('fails on a term in a file path', () => {
    const result = scan({ 'quux-list.ts': 'export {};\n' });
    expect(result.status).toBe(1);
  });

  it('fails on a foreign requirement ID with the repository denylist', () => {
    // Joined at runtime: written whole, the neutral probe would trip the repository's own scan.
    const foreignId = ['XY', 'ITEM', '1.2'].join('-');
    const result = scan({ 'probe.md': `Replaces ${foreignId}.\n` }, 'repository');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('probe.md');
  });

  it('allows library requirement IDs and license identifiers with the repository denylist', () => {
    const result = scan(
      { 'SPEC.md': 'UIC-BUTTON-1.2, UIC-ICON-LABEL-1.2 and CC-BY-4.0\n' },
      'repository',
    );
    expect(result.status).toBe(0);
  });
});
