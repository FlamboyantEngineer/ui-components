// Fails on an export of a library module that nothing outside its own file uses and no entry point
// reaches: the export only widens the module's surface (UIC-TOOLING-2.4).
//
// Usage: ui-components-tooling check-exports [--fix]
//   --fix  drops the `export` keyword of each flagged declaration that its own file still uses.
//
// The checker follows symbol references from library modules, tests and supporting scripts.
// It also follows module namespaces and the types named in inferred declarations.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { loadConfig } from './config.mjs';
import { flag, relativePosix, reportProblems, root, walk } from './lib/script.mjs';
import { findPackageEntries } from './package-entries.mjs';

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

/** Reads imports and re-exports without loading the supporting scripts into the type checker. */
function readModuleReferences(source, visit) {
  const read = (/** @type {import('typescript').Node} */ node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const from = node.moduleSpecifier.text;
      const { name, namedBindings } = node.importClause ?? {};
      if (name) visit(from, 'default');
      if (namedBindings && ts.isNamespaceImport(namedBindings)) visit(from);
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const item of namedBindings.elements)
          visit(from, (item.propertyName ?? item.name).text);
      }
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const from = node.moduleSpecifier.text;
      if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) visit(from);
      else
        for (const item of node.exportClause.elements)
          visit(from, (item.propertyName ?? item.name).text);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      if (ts.isStringLiteral(node.argument.literal)) {
        let name = node.qualifier;
        while (name && ts.isQualifiedName(name)) name = name.left;
        visit(node.argument.literal.text, name?.text);
      }
    } else if (ts.isCallExpression(node)) {
      const [argument] = node.arguments;
      const { expression } = node;
      const importsNamespace =
        expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(expression) && expression.text === 'require');
      if (importsNamespace && argument && ts.isStringLiteralLike(argument)) visit(argument.text);
    }
    ts.forEachChild(node, read);
  };
  read(source);
}

/** Matches each import to the symbol its source module actually exports. */
function readExternalUses(program, paths, entries) {
  const checker = program.getTypeChecker();
  const options = program.getCompilerOptions();
  const resolution = ts.createModuleResolutionCache(root, (path) => path, options);
  /** @type {Set<import('typescript').Symbol>} */
  const external = new Set();
  const useExports = (path, name) => {
    const source = program.getSourceFile(path);
    const module = source && checker.getSymbolAtLocation(source);
    if (!module) return;
    for (const symbol of checker.getExportsOfModule(module)) {
      if (name === undefined || symbol.name === name) external.add(resolveAlias(checker, symbol));
    }
  };
  const useReference = (path, from, name) => {
    const { resolvedModule } = ts.resolveModuleName(from, path, options, ts.sys, resolution);
    if (resolvedModule && resolvedModule.resolvedFileName !== path)
      useExports(resolvedModule.resolvedFileName, name);
  };
  for (const path of entries) useExports(path, undefined);
  for (const path of paths) {
    const source =
      program.getSourceFile(path) ??
      ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    readModuleReferences(source, (from, name) => useReference(path, from, name));
  }
  // Declarations can infer a reference the source never imported, e.g. `import("./shape").Shape`.
  program.emit(undefined, (name, text, _bom, _onError, sources) => {
    const path = sources?.[0]?.fileName;
    if (path && text.includes('import(')) {
      const source = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
      readModuleReferences(source, (from, imported) => useReference(path, from, imported));
    }
  });
  return external;
}

/** @param {import('typescript').TypeChecker} checker @param {import('typescript').Symbol} symbol */
function resolveAlias(checker, symbol) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return checker.getExportSymbolOfSymbol(target);
}

/** Finds references in the exporting file so `--fix` knows when it can remove only the keyword. */
function readLocalUses(checker, source, exports) {
  const names = new Set(exports.map((symbol) => symbol.name));
  /** @type {Set<import('typescript').Symbol>} */
  const used = new Set();
  const visit = (/** @type {import('typescript').Node} */ node) => {
    if (ts.isIdentifier(node) && names.has(node.text)) {
      const parent = node.parent;
      const symbol =
        ts.isShorthandPropertyAssignment(parent) && parent.name === node
          ? checker.getShorthandAssignmentValueSymbol(parent)
          : checker.getSymbolAtLocation(node);
      if (symbol) {
        const target = resolveAlias(checker, symbol);
        if (!target.declarations?.some((declaration) => declaration === parent)) used.add(target);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return used;
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
const entries = findPackageEntries(root, join(root, 'src'), modules, 'source');
entries.push(...entriesOption.map((path) => join(root, path)));
const external = readExternalUses(program, [...modules, ...others], entries);
const checker = program.getTypeChecker();

const problems = [];
/** @type {Map<string, Array<{ start: number, end: number }>>} */
const fixes = new Map();
for (const path of modules) {
  const source = program.getSourceFile(path);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!source || !moduleSymbol) continue;
  const candidates = checker
    .getExportsOfModule(moduleSymbol)
    .filter(
      (symbol) =>
        !(symbol.flags & ts.SymbolFlags.Alias) &&
        symbol.name !== 'default' &&
        !external.has(symbol) &&
        symbol.declarations?.[0]?.getSourceFile() === source,
    );
  if (candidates.length === 0) continue;
  const local = readLocalUses(checker, source, candidates);
  for (const exported of candidates) {
    const declaration = exported.declarations?.[0];
    if (!declaration) continue;
    const line = source.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
    const at = `${relativePosix(root, path)}:${line}`;
    if (!local.has(exported)) {
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
