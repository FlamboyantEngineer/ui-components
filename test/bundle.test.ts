// @vitest-environment node
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';
import * as glyphPaths from '../src/core/glyph-paths.js';

/** The built-in glyph paths a bundle of `contents` keeps, by export name. */
async function retainedIcons(contents: string) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    write: false,
    minify: true,
    format: 'esm',
    platform: 'browser',
    external: ['react', 'react-dom', 'react/*', 'react-dom/*'],
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const output = result.outputFiles.map((file) => file.text).join('\n');
  return Object.entries(glyphPaths)
    .filter(([, path]) => output.includes(path))
    .map(([name]) => name);
}

describe('icon tree shaking', () => {
  // Button draws the external-link glyph itself, after the label of a link that opens a new tab
  // (UIC-BUTTON-1.9), so that glyph is the only one a Button keeps.
  it('UIC-ICON-1.1 retains only the glyph Button draws itself for a Button-only entry point', async () => {
    expect(
      await retainedIcons("export { Button } from './src/components/button/index.ts'"),
    ).toEqual(['arrowTopRightOnSquarePath']);
  });

  it('UIC-ICON-1.1 retains only the requested icon through the package root', async () => {
    expect(await retainedIcons("export { Button, PlusGlyph } from './src/index.ts'")).toEqual([
      'arrowTopRightOnSquarePath',
      'plusPath',
    ]);
  });
});
