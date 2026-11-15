// Fails on an export of a library module that nothing outside its own file uses and no entry point
// reaches: the export only widens the module's surface (UIC-TOOLING-2.4).
//
// Usage: ui-components-tooling check-exports [--fix]
//   --fix  drops the `export` keyword of each flagged declaration that its own file still uses.
//
// A name counts as used outside its file when the same identifier appears in another library
// module (a re-export included), in a test, or under labs/, e2e/, examples/, test/ or
// scripts/. Matching by name may miss an unused export whose name another file also uses; it never
// flags a used one.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { loadConfig } from './config.mjs';
import { flag, relativePosix, reportProblems, root, walk } from './lib/script.mjs';

const SOURCE = /\.(?:tsx?|mts)$/;
const SCRIPT = /\.(?:tsx?|mts|mjs|js)$/;
const TEST = /\.(?:test|spec)\.tsx?$/;
const OTHER_DIRS = ['labs', 'e2e', 'examples', 'test', 'scripts'];
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build']);

// The repository's own TypeScript, which the check parses with.
/** @type {typeof import('typescript')} */
const ts = createRequire(join(root, 'package.json'))('typescript');

/** @param {string} dir */
function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return walk(dir).filter((path) => {
    const parts = relativePosix(root, path).split('/');
    return !parts.some((part) => SKIPPED_DIRS.has(part) || part.startsWith('.'));
  });
}

/**
 * The source modules the package's `exports` map points at, `./dist/<path>.js` read as
 * `src/<path>.ts`, plus the configured `exports.entries`.
 * @param {string[]} extra
 */
function entryPoints(extra) {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const targets = [];
  const collect = (/** @type {unknown} */ value) => {
    if (typeof value === 'string') targets.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(manifest.exports);
  const sources = listFiles(join(root, 'src')).filter((path) => SOURCE.test(path));
  const entries = new Set(extra.map((path) => join(root, path)));
  for (const target of targets) {
    const base = /^\.\/dist\/(.+)\.(?:d\.ts|js)$/.exec(target)?.[1];
    if (!base) continue;
    const pattern = new RegExp(
      `^src/${base.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}\\.tsx?$`,
    );
    for (const path of sources) if (pattern.test(relativePosix(root, path))) entries.add(path);
  }
  return [...entries];
}

/**
 * How often each identifier appears, per library module and in total outside library modules. A
 * module's emitted declarations count as its own text, since they name the types it infers.
 * @param {string[]} modules
 * @param {string[]} others
 * @param {Map<string, string>} declarations emitted declaration text by source module
 */
function countNames(modules, others, declarations) {
  /** @type {Map<string, Map<string, number>>} */
  const inModules = new Map();
  /** @type {Set<string>} */
  const elsewhere = new Set();
  const scan = (
    /** @type {string} */ path,
    /** @type {(name: string) => void} */ add,
    text = readFileSync(path, 'utf8'),
  ) => {
    const kind = /x$/.test(path) ? ts.ScriptKind.TSX : undefined;
    const visit = (/** @type {import('typescript').Node} */ node) => {
      if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) add(node.text);
      ts.forEachChild(node, visit);
    };
    visit(ts.createSourceFile(path, text, ts.ScriptTarget.Latest, false, kind));
  };
  for (const path of modules) {
    const add = (/** @type {string} */ name) => {
      const files = inModules.get(name) ?? new Map();
      files.set(path, (files.get(path) ?? 0) + 1);
      inModules.set(name, files);
    };
    scan(path, add);
    const declaration = declarations.get(path);
    // Only the names a declaration adds through an inferred type: `import("./a").Name`.
    if (declaration)
      scan(`${path}.d.ts`, (name) => add(name), declaration.replace(/^(?!.*import\().*$/gm, ''));
  }
  for (const path of others) scan(path, (name) => elsewhere.add(name));
  return { inModules, elsewhere };
}

/** The `export` keyword of a declaration statement, if it has one. */
function exportKeyword(/** @type {import('typescript').Node} */ declaration) {
  let node = declaration;
  while (node && !ts.canHaveModifiers(node)) node = node.parent;
  if (ts.isVariableDeclaration(declaration)) node = declaration.parent.parent;
  const modifiers = node && ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return modifiers?.find((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

/** Whether `export` marks the declaration itself, not an `export { … }` list. */
function isSingleDeclaration(/** @type {import('typescript').Node} */ declaration) {
  if (!ts.isVariableDeclaration(declaration)) return true;
  const list = declaration.parent;
  return ts.isVariableDeclarationList(list) && list.declarations.length === 1;
}

const config = await loadConfig(root);
const entriesOption = config.exports?.entries ?? [];
const all = listFiles(join(root, 'src')).filter((path) => SCRIPT.test(path));
const modules = all.filter(
  (path) => SOURCE.test(path) && !TEST.test(path) && !path.endsWith('.d.ts'),
);
const others = [
  ...all.filter((path) => TEST.test(path)),
  ...OTHER_DIRS.flatMap((dir) => listFiles(join(root, dir)).filter((path) => SCRIPT.test(path))),
];
const parsed = ts.getParsedCommandLineOfConfigFile(
  join(root, 'tsconfig.json'),
  {},
  { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
);
const program = ts.createProgram(modules, {
  ...parsed?.options,
  noEmit: false,
  declaration: true,
  emitDeclarationOnly: true,
  declarationMap: false,
  outDir: join(root, '.check-exports'),
});
const checker = program.getTypeChecker();
/** @type {Map<string, string>} */
const declarations = new Map();
program.emit(undefined, (_name, text, _bom, _onError, sources) => {
  if (sources?.[0]) declarations.set(resolve(sources[0].fileName), text);
});
const { inModules, elsewhere } = countNames(modules, others, declarations);

/** @param {import('typescript').Symbol} symbol */
const resolveAlias = (symbol) =>
  symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
/** Every export of a module, through its re-exports, counts as reached. */
const reached = new Set();
const reachModule = (/** @type {import('typescript').Symbol | undefined} */ moduleSymbol) => {
  if (!moduleSymbol) return;
  for (const exported of checker.getExportsOfModule(moduleSymbol))
    reached.add(resolveAlias(exported));
};
for (const entry of entryPoints(entriesOption)) {
  const source = program.getSourceFile(entry);
  reachModule(source && checker.getSymbolAtLocation(source));
}
// A namespace import or `export * as` uses every export of its module, whatever names it reads.
for (const path of modules) {
  const source = program.getSourceFile(path);
  for (const statement of source?.statements ?? []) {
    const isImport = ts.isImportDeclaration(statement);
    if (!isImport && !ts.isExportDeclaration(statement)) continue;
    const bindings = isImport ? statement.importClause?.namedBindings : statement.exportClause;
    const isNamespace =
      bindings && (ts.isNamespaceImport(bindings) || ts.isNamespaceExport(bindings));
    if (isNamespace && statement.moduleSpecifier) {
      reachModule(checker.getSymbolAtLocation(statement.moduleSpecifier));
    }
  }
}

const problems = [];
/** @type {Map<string, Array<{ start: number, end: number }>>} */
const fixes = new Map();
for (const path of modules) {
  const source = program.getSourceFile(path);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!source || !moduleSymbol) continue;
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    if (exported.flags & ts.SymbolFlags.Alias || exported.name === 'default') continue;
    const declaration = exported.declarations?.[0];
    if (!declaration || declaration.getSourceFile() !== source || reached.has(exported)) continue;
    if (elsewhere.has(exported.name)) continue;
    const files = inModules.get(exported.name) ?? new Map();
    const usedElsewhere = [...files.keys()].some((file) => file !== path);
    if (usedElsewhere) continue;
    const own = files.get(path) ?? 0;
    const line = source.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
    const at = `${relativePosix(root, path)}:${line}`;
    if (own <= 1) {
      problems.push(`${at}: ${exported.name} is exported and used nowhere; delete it`);
      continue;
    }
    const keyword = exportKeyword(declaration);
    if (flag('fix') && keyword && isSingleDeclaration(declaration)) {
      const list = fixes.get(path) ?? [];
      list.push({ start: keyword.getStart(source), end: keyword.getEnd() });
      fixes.set(path, list);
      continue;
    }
    problems.push(`${at}: ${exported.name} is used only in this file; drop its export`);
  }
}

for (const [path, ranges] of fixes) {
  let text = readFileSync(path, 'utf8');
  for (const { start, end } of ranges.sort((left, right) => right.start - left.start)) {
    const after = text.slice(end).match(/^\s*/)?.[0].length ?? 0;
    text = text.slice(0, start) + text.slice(end + after);
  }
  writeFileSync(path, text);
}

reportProblems(problems, {
  heading: 'Exports that nothing outside their file uses (UIC-TOOLING-2.4):',
  hint: 'Run `ui-components-tooling check-exports --fix` to drop the exports a file still uses.',
  success: `No needless exports in ${modules.length} library modules.`,
});
