// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { expect, it } from 'vitest';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { createFontBundle, FONT_STYLESHEET, fontBundleProblems } from '../scripts/lib/fonts.mjs';

interface FontBundle {
  css: string;
  files: Record<string, string>;
}

function writeFontBundle(directory: string): FontBundle {
  const bundle = createFontBundle() as FontBundle;
  for (const [file, source] of Object.entries(bundle.files)) {
    const target = join(directory, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
  writeFileSync(join(directory, FONT_STYLESHEET as string), bundle.css);
  return bundle;
}

it('UIC-LABS-1.9 includes both reference families, variable normal/italic faces and local subsets with both licenses', () => {
  const { css, files } = createFontBundle() as FontBundle;
  for (const family of ['Geist', 'Geist Mono']) {
    expect(css).toContain(`font-family: '${family}';`);
  }
  expect(css).toContain('font-style: normal');
  expect(css).toContain('font-style: italic');
  expect(css).toContain('font-weight: 100 900');
  expect(css).toContain('font-display: swap');
  expect(css).not.toMatch(/@import|https?:|Geist Variable|Geist Mono Variable/);
  const urls = [...css.matchAll(/url\('(.+?)'\)/g)].map(([, url]) => url);
  const binaries = Object.keys(files).filter((file) => file.endsWith('.woff2'));
  expect(urls).toHaveLength(binaries.length);
  expect(urls).toEqual(binaries.map((file) => file.replace('labs/build/', './')));
  const licenses = Object.keys(files).filter((file) => file.endsWith('-LICENSE'));
  expect(licenses).toHaveLength(2);
  for (const file of licenses) {
    expect(readFileSync(files[file] ?? '', 'utf8')).toContain('SIL OPEN FONT LICENSE');
  }
});

it('UIC-LABS-1.9 rejects modified declarations, damaged fonts and missing licenses in an installed bundle', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ui-font-bundle-'));
  try {
    const bundle = writeFontBundle(directory);
    expect(fontBundleProblems(directory)).toEqual([]);
    const font = Object.keys(bundle.files).find((file) => file.endsWith('.woff2')) ?? '';
    const license = Object.keys(bundle.files).find((file) => file.endsWith('-LICENSE')) ?? '';
    writeFileSync(join(directory, font), 'damaged font');
    rmSync(join(directory, license));
    writeFileSync(
      join(directory, FONT_STYLESHEET as string),
      `${bundle.css}\n@import 'https://example.com/fonts.css';`,
    );
    expect(fontBundleProblems(directory)).toEqual(
      expect.arrayContaining([
        `${FONT_STYLESHEET as string} differs from the default font declarations`,
        `${font} differs from its upstream font asset`,
        `missing ${license}`,
      ]),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

// Real Git indexing of every font and license can outlive the DOM-test deadline on Windows.
it('UIC-LABS-1.9 preserves font assets in Git release trees with automatic CRLF conversion enabled', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ui-font-git-'));
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd: directory, stdio: ['pipe', 'pipe', 'pipe'] });
  try {
    const bundle = writeFontBundle(directory);
    copyFileSync(join(process.cwd(), '.gitattributes'), join(directory, '.gitattributes'));
    git(['init']);
    git(['config', 'core.autocrlf', 'true']);
    git(['add', '--force', '.']);
    for (const file of [FONT_STYLESHEET as string, ...Object.keys(bundle.files)]) {
      expect(git(['show', `:${file}`])).toEqual(readFileSync(join(directory, file)));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 30_000);
