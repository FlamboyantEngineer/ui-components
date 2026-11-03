// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, win32 } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import local from '../eslint-rules/index.js';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { runNpm } from '../scripts/lib/npm.mjs';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { findMissingRootRefs } from '../scripts/lib/root-refs.mjs';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { relativePosix } from '../scripts/lib/script.mjs';
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

  it('UIC-LABS-1.2 lists Windows paths with the forward slashes the vendored file list uses', () => {
    const vendored = 'C:\\out\\labs\\build\\vendor\\pdf.min.mjs';
    expect(relativePosix('C:\\out', vendored, win32)).toBe('labs/build/vendor/pdf.min.mjs');
    expect(relativePosix('/out', '/out/labs/build/vendor/pdf.min.mjs')).toBe(
      'labs/build/vendor/pdf.min.mjs',
    );
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

  it('UIC-COMPOSITION-2.5 reports a rooted component without a ref and a stale rootless entry', () => {
    const dir = tempDir();
    const entry = join(dir, 'index.d.ts');
    writeFileSync(
      entry,
      [
        'type ReactNode = string | null;',
        'export declare function Rooted(props: { ref?: unknown; label: string }): ReactNode;',
        'export declare function Bare(props: { label: string }): ReactNode;',
        'export declare function Provider(props: { children: ReactNode }): ReactNode;',
        'export declare function Listed(props: { ref?: unknown }): ReactNode;',
        'export declare function format(value: string): string;',
      ].join('\n'),
    );
    const rootless = new Map([
      ['Provider', 'a context provider'],
      ['Listed', 'a context provider'],
      ['Gone', 'a context provider'],
    ]);
    expect(findMissingRootRefs([entry], { rootless })).toEqual({
      problems: [
        'Bare declares no ref for its root element',
        'Listed takes a ref but is listed as rootless',
        'Gone is listed as rootless but not exported',
      ],
      checked: 4,
    });
    expect(findMissingRootRefs([entry], { rootless, checkRootless: false }).problems).toEqual([
      'Bare declares no ref for its root element',
      'Listed takes a ref but is listed as rootless',
    ]);
  });
});
