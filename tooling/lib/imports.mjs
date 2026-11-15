// The import graph of a repository's TypeScript modules and the cycles in it.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * Whether an import or export statement brings in types only, which compile away.
 * @param {ts.ImportDeclaration | ts.ExportDeclaration} statement
 */
function isTypeOnly(statement) {
  if (ts.isExportDeclaration(statement)) {
    const clause = statement.exportClause;
    const named = clause && ts.isNamedExports(clause) ? clause.elements : [];
    return statement.isTypeOnly || (named.length > 0 && named.every((item) => item.isTypeOnly));
  }
  const clause = statement.importClause;
  if (!clause) return false;
  const bindings = clause.namedBindings;
  const named = bindings && ts.isNamedImports(bindings) ? bindings.elements : [];
  return (
    clause.isTypeOnly ||
    (!clause.name && named.length > 0 && named.every((item) => item.isTypeOnly))
  );
}

/**
 * The parsed module at `path`.
 * @param {string} path
 */
export function parseModule(path) {
  return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest);
}

/**
 * Whether the module only re-exports, with `export … from` statements.
 * @param {ts.SourceFile} source
 */
export function isReExportOnly(source) {
  return source.statements.every(
    (statement) => ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined,
  );
}

/**
 * The modules a source file imports or re-exports, by specifier, with whether only types come in.
 * @param {ts.SourceFile} source
 * @returns {{ specifier: string, typeOnly: boolean }[]}
 */
export function moduleImports(source) {
  const found = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    found.push({ specifier: specifier.text, typeOnly: isTypeOnly(statement) });
  }
  return found;
}

/**
 * The file a relative specifier of the module at `from` names, or `undefined` for a package or a
 * missing file. `./x.js` names `x.ts`, `x.tsx` or `x/index.ts`.
 * @param {string} from
 * @param {string} specifier
 */
export function resolveRelative(from, specifier) {
  if (!specifier.startsWith('.')) return undefined;
  const base = join(from, '..', specifier.replace(/\.js$/, ''));
  return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find((path) => existsSync(path));
}

/**
 * The strongly connected groups of more than one node in a directed graph (Tarjan's algorithm):
 * each is a set of modules that import each other through a cycle.
 * @param {Map<string, string[]>} graph
 * @returns {string[][]}
 */
export function findCycles(graph) {
  const order = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const cycles = [];
  const visit = (node) => {
    order.set(node, order.size);
    low.set(node, order.get(node));
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (!order.has(next)) {
        visit(next);
        low.set(node, Math.min(low.get(node), low.get(next)));
      } else if (onStack.has(next)) low.set(node, Math.min(low.get(node), order.get(next)));
    }
    if (low.get(node) !== order.get(node)) return;
    const cycle = [];
    let member;
    do {
      member = stack.pop();
      onStack.delete(member);
      cycle.push(member);
    } while (member !== node);
    if (cycle.length > 1) cycles.push(cycle);
  };
  for (const node of graph.keys()) if (!order.has(node)) visit(node);
  return cycles;
}
