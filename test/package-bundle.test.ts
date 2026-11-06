// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  bundleConsumer as bundle,
  installPackedConsumer,
  // @ts-expect-error The scripts are plain JavaScript modules without declarations.
} from '../scripts/lib/consumer-bundle.mjs';
import * as glyphPaths from '../src/core/glyph-paths.js';

const root = process.cwd();
const cssImport = "import '@flamboyantengineer/ui-components/reference.css';";

async function bundleConsumer(consumer: string, contents: string): Promise<string> {
  const { code } = (await bundle(consumer, contents)) as { code: string };
  return code;
}

it('UIC-LABS-1.6 UIC-HOOKS-3.1 retains the exported CSS in production while removing unused JavaScript', async () => {
  // Packing and real production compilations need more time than a DOM unit test.
  for (const file of ['dist/index.js', 'labs/build/reference.css']) {
    if (!existsSync(join(root, file))) {
      throw new Error(`Missing ${file}; run npm run build:package before this test`);
    }
  }
  const consumer = mkdtempSync(join(tmpdir(), 'ui-package-bundle-'));
  try {
    const installed = installPackedConsumer(consumer) as string;

    const cssOnly = await bundleConsumer(consumer, cssImport);
    expect(cssOnly).toContain('.ui-button');
    expect(cssOnly).toContain('@layer ui-reference');

    const withGlyph = await bundleConsumer(
      consumer,
      `${cssImport}
import { PlusGlyph } from '@flamboyantengineer/ui-components';
globalThis.selectedGlyph = PlusGlyph;`,
    );
    expect(withGlyph).toContain('.ui-button');
    expect(withGlyph).toContain('@layer ui-reference');
    expect(
      Object.entries(glyphPaths)
        .filter(([, path]) => withGlyph.includes(path))
        .map(([name]) => name),
    ).toEqual(['plusPath']);

    // The identical consumer must reproduce the bug when only the packed metadata changes.
    const manifestPath = join(installed, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, sideEffects: false }));
    const withoutCssEffects = await bundleConsumer(consumer, cssImport);
    expect(withoutCssEffects).not.toContain('.ui-button');
    expect(withoutCssEffects).not.toContain('@layer ui-reference');
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
}, 120_000);
