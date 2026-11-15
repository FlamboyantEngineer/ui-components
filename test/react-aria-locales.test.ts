// @vitest-environment node
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import * as esbuild from 'esbuild';
import { describe, expect, it } from 'vitest';
import {
  LAB_LOCALES,
  LIBRARY_LOCALES,
  optimizeLocalesForEsbuild,
  // @ts-expect-error The scripts are plain JavaScript modules without declarations.
} from '../scripts/lib/react-aria-locales.mjs';

const require = createRequire(import.meta.url);
const reactStately = dirname(require.resolve('react-stately/package.json'));

/** The React Aria strings modules a bundle of the color strings holds. */
async function bundledStrings(locales: readonly string[]) {
  const result = await esbuild.build({
    entryPoints: [join(reactStately, 'dist/private/color/intlStrings.mjs')],
    bundle: true,
    write: false,
    metafile: true,
    format: 'esm',
    logLevel: 'silent',
    plugins: [optimizeLocalesForEsbuild(locales)],
  });
  return Object.keys(result.metafile.inputs)
    .filter((input) => !input.startsWith('react-aria-removed-locale:'))
    .map((input) => /([a-z]{2}-[A-Z]{2})\.m?js$/.exec(input)?.[1])
    .filter((locale) => locale !== undefined)
    .sort();
}

describe("React Aria's strings", () => {
  it("UIC-LABS-1.10 names the library's languages from its language files", () => {
    expect(LIBRARY_LOCALES).toEqual(['en', 'es', 'fr', 'ja']);
    expect(LAB_LOCALES).toEqual(expect.arrayContaining([...LIBRARY_LOCALES, 'ar', 'he']));
  });

  it('UIC-LABS-1.10 keeps the strings of the given languages and locales only', async () => {
    expect(await bundledStrings(['en', 'fr', 'pt-BR'])).toEqual(['en-US', 'fr-FR', 'pt-BR']);
    expect(await bundledStrings(['en', 'pt-PT'])).toEqual(['en-US', 'pt-PT']);
  });
});
