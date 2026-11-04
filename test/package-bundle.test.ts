// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import TerserPlugin from 'terser-webpack-plugin';
import { expect, it } from 'vitest';
import { webpack } from 'webpack';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { packTarball } from '../scripts/lib/npm.mjs';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { extractTarGz } from '../scripts/lib/tar.mjs';
import * as glyphPaths from '../src/core/glyph-paths.js';

const root = process.cwd();
const require = createRequire(import.meta.url);
const cssImport = "import '@flamboyantengineer/ui-components/reference.css';";

async function bundleConsumer(consumer: string, contents: string): Promise<string> {
  writeFileSync(join(consumer, 'entry.js'), contents);
  const compiler = webpack({
    mode: 'production',
    context: consumer,
    entry: './entry.js',
    output: { path: join(consumer, 'output'), filename: 'bundle.js' },
    cache: false,
    devtool: false,
    resolve: { modules: [join(consumer, 'node_modules'), join(root, 'node_modules')] },
    module: {
      rules: [
        { test: /\.css$/, use: [require.resolve('style-loader'), require.resolve('css-loader')] },
      ],
    },
    // Run the production minifier in this worker rather than spawning unbounded workers.
    optimization: { minimizer: [new TerserPlugin({ parallel: false })] },
  });
  if (!compiler) throw new Error('Webpack did not create a compiler');
  try {
    await new Promise<void>((resolve, reject) => {
      compiler.run((error, stats) => {
        if (error) reject(error);
        else if (!stats || stats.hasErrors()) {
          reject(new Error(stats?.toString({ all: false, errors: true }) ?? 'No webpack result'));
        } else resolve();
      });
    });
    return readFileSync(join(consumer, 'output/bundle.js'), 'utf8');
  } finally {
    await new Promise<void>((resolve, reject) => {
      compiler.close((error) => (error ? reject(error) : resolve()));
    });
  }
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
    const { filename } = packTarball(root, consumer) as { filename: string };
    extractTarGz(join(consumer, filename), consumer);
    const scope = join(consumer, 'node_modules/@flamboyantengineer');
    mkdirSync(scope, { recursive: true });
    const installed = join(scope, 'ui-components');
    renameSync(join(consumer, 'package'), installed);
    writeFileSync(
      join(consumer, 'package.json'),
      JSON.stringify({ private: true, type: 'module' }),
    );

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
