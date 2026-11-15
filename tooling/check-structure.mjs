// Enforces the structure rules every repository shares, with the settings of its
// tooling.config.mjs (specs/TOOLING.md, UIC-TOOLING-2.3), then runs the repository's own rules:
//   - files and directories under `structure.names` are kebab-case;
//   - every `index.ts` in `src/` only re-exports, with `export … from` statements;
//   - library source imports nothing outside `src/`, and a layer imports only the layers it lists,
//     and no Node module when it runs in a browser;
//   - library modules import each other in no cycle (only across `structure.cyclesAcross`
//     directories when it is set).

import { builtinModules } from 'node:module';
import { basename, join, resolve, sep } from 'node:path';
import { loadConfig } from './config.mjs';
import {
  findCycles,
  isReExportOnly,
  moduleImports,
  parseModule,
  resolveRelative,
} from './lib/imports.mjs';
import { relativePosix, reportProblems, root, walk } from './lib/script.mjs';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+)*$/;
const NODE_ONLY = new Set([...builtinModules, 'ws']);
const SOURCE = /\.tsx?$/;
const TEST = /\.test\.tsx?$/;

const { structure } = await loadConfig(root);
const { names, cyclesAcross, typeImportCycles = false, layers = {}, rules } = structure;
const problems = [];
const rel = (path) => relativePosix(root, path);
const srcDir = join(root, 'src');

for (const dir of names) {
  for (const path of walk(join(root, dir), { directories: true })) {
    if (!KEBAB.test(basename(path)))
      problems.push(`${rel(path)}: file and directory names are kebab-case`);
  }
}

/** The layer of a path under `src/`, such as `client` for `src/client/room-provider.ts`. */
function layerOf(path) {
  const [top, layer = ''] = rel(path).split('/');
  return top === 'src' && Object.hasOwn(layers, layer) ? layer : undefined;
}

/** The problems of one package import of a module in `layer`. */
function checkPackageImport(path, layer, specifier) {
  const bare = specifier.replace(/^node:/, '').split('/')[0] ?? '';
  const isNode = specifier.startsWith('node:') || NODE_ONLY.has(bare);
  if (layer && layers[layer]?.browser && isNode) {
    problems.push(`${rel(path)}: ${layer}/ runs in a browser and cannot import ${specifier}`);
  }
}

/** The problems of one relative import, from a module in `layer` to `target`. */
function checkRelativeImport(path, layer, specifier) {
  const target = resolve(path, '..', specifier.replace(/\.js$/, '.ts'));
  if (!rel(target).startsWith('src/')) {
    problems.push(`${rel(path)}: library source cannot import ${specifier}`);
    return;
  }
  const targetLayer = layerOf(target);
  const allowed = layer ? (layers[layer]?.imports ?? []) : [];
  if (layer && targetLayer && targetLayer !== layer && !allowed.includes(targetLayer)) {
    problems.push(`${rel(path)}: ${layer}/ cannot import ${targetLayer}/`);
  }
}

const sources = walk(srcDir).filter((path) => SOURCE.test(path) && !TEST.test(path));
/** Each library module and the library modules it imports. */
const graph = new Map();

for (const path of sources) {
  const source = parseModule(path);
  const layer = layerOf(path);
  if (basename(path) === 'index.ts' && !isReExportOnly(source)) {
    problems.push(`${rel(path)}: an index.ts only re-exports with export … from`);
  }
  const targets = [];
  for (const { specifier, typeOnly } of moduleImports(source)) {
    if (!specifier.startsWith('.')) {
      checkPackageImport(path, layer, specifier);
      continue;
    }
    checkRelativeImport(path, layer, specifier);
    const target = resolveRelative(path, specifier);
    if (target && (typeImportCycles || !typeOnly)) targets.push(target);
  }
  graph.set(path, targets);
}

const acrossDir = cyclesAcross ? join(root, cyclesAcross) : undefined;
/** The directory under `cyclesAcross` that owns a module, or the module itself without it. */
const ownerOf = (path) =>
  !acrossDir
    ? path
    : path.startsWith(acrossDir + sep)
      ? path.slice(acrossDir.length + 1).split(sep)[0]
      : null;
for (const cycle of findCycles(graph)) {
  if (new Set(cycle.map(ownerOf)).size < 2) continue;
  const members = cycle.map(rel).sort().join(', ');
  problems.push(`import cycle${cyclesAcross ? ` across ${cyclesAcross}` : ''}: ${members}`);
}

problems.push(...(rules?.({ root }) ?? []));

reportProblems(problems, {
  heading: 'Structure problems (docs/CODING-GUIDELINES.md)',
  success: `${sources.length} library modules follow the structure rules.`,
});
