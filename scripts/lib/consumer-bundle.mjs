// Installs the packed package into a scratch consumer and bundles entry files there under
// production webpack, as a host's build would (UIC-LABS-1.6, UIC-LABS-1.8).

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import TerserPlugin from 'terser-webpack-plugin';
import webpackModule from 'webpack';
import { packTarball } from './npm.mjs';
import { root } from './script.mjs';
import { extractTarGz } from './tar.mjs';

const require = createRequire(import.meta.url);
const { webpack } = webpackModule;

/**
 * Packs `packageRoot` (the tree as built) into `consumer` and installs it there as
 * `node_modules/@flamboyantengineer/ui-components`. Returns the installed directory.
 */
export function installPackedConsumer(consumer, packageRoot = root) {
  const { filename } = packTarball(packageRoot, consumer);
  extractTarGz(join(consumer, filename), consumer);
  const scope = join(consumer, 'node_modules/@flamboyantengineer');
  mkdirSync(scope, { recursive: true });
  const installed = join(scope, 'ui-components');
  renameSync(join(consumer, 'package'), installed);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  return installed;
}

/** A chunk's source modules, looking inside concatenated modules, with their names and sizes. */
function chunkModules(compilation, chunk) {
  const leaves = (module) => (module.modules ? [...module.modules].flatMap(leaves) : [module]);
  return [...compilation.chunkGraph.getChunkModulesIterable(chunk)]
    .flatMap(leaves)
    .map((module) => ({
      name: module.readableIdentifier(compilation.requestShortener),
      size: module.size(),
    }));
}

/**
 * Bundles `contents` as the consumer's entry under production webpack, resolving the installed
 * package from the consumer and its other dependencies from the checkout. `externals` are left
 * to the host, such as React. Returns the code of every emitted chunk, the initial (entry) code
 * apart, and the source modules each chunk holds with their sizes before minifying.
 */
export async function bundleConsumer(consumer, contents, { externals = {}, name = 'entry' } = {}) {
  writeFileSync(join(consumer, `${name}.js`), contents);
  const output = join(consumer, 'output', name);
  const compiler = webpack({
    mode: 'production',
    context: consumer,
    entry: `./${name}.js`,
    output: { path: output, filename: 'bundle.js', chunkFilename: '[id].chunk.js' },
    cache: false,
    devtool: false,
    externals,
    resolve: { modules: [join(consumer, 'node_modules'), join(root, 'node_modules')] },
    module: {
      rules: [
        { test: /\.css$/, use: [require.resolve('style-loader'), require.resolve('css-loader')] },
        { test: /\.woff2$/, type: 'asset/resource' },
      ],
    },
    performance: { hints: false },
    // Run the production minifier in this worker rather than spawning unbounded workers.
    optimization: { minimizer: [new TerserPlugin({ parallel: false })] },
  });
  if (!compiler) throw new Error('Webpack did not create a compiler');
  try {
    const stats = await new Promise((resolve, reject) => {
      compiler.run((error, result) => {
        if (error) reject(error);
        else if (!result || result.hasErrors()) {
          reject(new Error(result?.toString({ all: false, errors: true }) ?? 'No webpack result'));
        } else resolve(result);
      });
    });
    const { compilation } = stats;
    const chunks = [...compilation.chunks].map((chunk) => ({
      initial: chunk.canBeInitial(),
      files: [...chunk.files].filter((file) => file.endsWith('.js')),
      modules: chunkModules(compilation, chunk),
    }));
    const read = (file) => readFileSync(join(output, file), 'utf8');
    return {
      code: chunks
        .filter((chunk) => chunk.initial)
        .flatMap((chunk) => chunk.files.map(read))
        .join('\n'),
      chunks: chunks.map((chunk) => ({ ...chunk, code: chunk.files.map(read).join('\n') })),
    };
  } finally {
    await new Promise((resolve, reject) => {
      compiler.close((error) => (error ? reject(error) : resolve(undefined)));
    });
  }
}
