// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import local from '../eslint-rules/index.js';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { runNpm } from '../scripts/lib/npm.mjs';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { createTarGz, extractTarGz } from '../scripts/lib/tar.mjs';

const dirs: string[] = [];

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'ui-script-lib-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('script helpers', () => {
  it('UIC-LABS-1.2 writes and reads gzipped tar archives without a tar binary', () => {
    const dir = tempDir();
    const deep = join('labs', 'build', 'a'.repeat(90), `${'b'.repeat(60)}.js`);
    mkdirSync(join(dir, 'labs', 'build', 'a'.repeat(90)), { recursive: true });
    writeFileSync(join(dir, deep), 'export {};\n');
    writeFileSync(join(dir, 'labs', 'index.html'), '<!doctype html>');
    createTarGz(join(dir, 'labs.tgz'), dir, ['labs/index.html', 'labs/build']);
    extractTarGz(join(dir, 'labs.tgz'), join(dir, 'out'));
    expect(readFileSync(join(dir, 'out', deep), 'utf8')).toBe('export {};\n');
    expect(readFileSync(join(dir, 'out', 'labs', 'index.html'), 'utf8')).toBe('<!doctype html>');
  });

  it('UIC-LABS-1.2 refuses an archive entry that leaves the target directory', () => {
    const dir = tempDir();
    const header = Buffer.alloc(512);
    header.write('../escape.txt', 0);
    header.write('0000644\0', 100);
    header.write('00000000000\0', 124);
    header.write('0', 156);
    writeFileSync(join(dir, 'bad.tgz'), gzipSync(Buffer.concat([header, Buffer.alloc(1024)])));
    expect(() => extractTarGz(join(dir, 'bad.tgz'), join(dir, 'out'))).toThrow('leaves');
  });

  it('runs npm through the shared helper', () => {
    expect(String(runNpm(['--version'])).trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('applies the component import rule to Windows paths', () => {
    const reports: unknown[] = [];
    const rule = (
      local as {
        rules: Record<
          string,
          { create: (context: object) => Record<string, (node: object) => void> }
        >;
      }
    ).rules['component-imports'];
    const visitor = rule?.create({
      filename: 'C:\\repo\\src\\components\\probe\\probe.tsx',
      report: (report: unknown) => reports.push(report),
    });
    visitor?.ImportDeclaration?.({ source: { value: '../table/table-rows.js' } });
    expect(reports).toHaveLength(1);
  });
});
