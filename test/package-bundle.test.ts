// @vitest-environment node
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

it('UIC-LABS-1.9 emits self-hosted fonts only when fonts.css is explicitly imported in a production consumer', async () => {
  // Packing and two real production compilations outlive the default DOM test timeout.
  const consumer = mkdtempSync(join(tmpdir(), 'ui-font-consumer-'));
  try {
    installPackedConsumer(consumer);
    const without = (await bundle(consumer, cssImport, { name: 'without-fonts' })) as {
      code: string;
    };
    expect(without.code).not.toContain('@font-face');
    expect(
      readdirSync(join(consumer, 'output/without-fonts')).filter((file) => file.endsWith('.woff2')),
    ).toEqual([]);
    const withFonts = (await bundle(
      consumer,
      `${cssImport}\nimport '@flamboyantengineer/ui-components/fonts.css';`,
      { name: 'with-fonts' },
    )) as { code: string };
    expect(withFonts.code).toContain('@font-face');
    expect(withFonts.code).toContain('Geist Mono');
    expect(withFonts.code).toContain('.ui-button');
    const fonts = readdirSync(join(consumer, 'output/with-fonts')).filter((file) =>
      file.endsWith('.woff2'),
    );
    expect(fonts.length).toBeGreaterThanOrEqual(4);
    for (const font of fonts) {
      expect(
        readFileSync(join(consumer, 'output/with-fonts', font))
          .subarray(0, 4)
          .toString(),
      ).toBe('wOF2');
    }
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
}, 120_000);
