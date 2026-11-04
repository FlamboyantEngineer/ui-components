#!/usr/bin/env node
// Enforces the structural rules of docs/CODING-GUIDELINES.md that lint cannot see:
//   N1 kebab-case files, N2/S5 one name per component across spec, lab, test and partial (a
//   directory may hold a family of components without a namesake, such as layout primitives),
//   S2 component directory layout, S3 re-export-only entry points, I2 props that extend BaseProps,
//   N8 one createHooks declaration per component, S8 no import cycles between components.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, sep } from 'node:path';
import ts from 'typescript';
import { relativePosix, reportProblems, root, walk } from './lib/script.mjs';

const componentsDir = join(root, 'src', 'components');
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+)*$/;
// Components that render no element of their own: they provide context, portal or relay content.
const NO_ELEMENT = /(?:Provider|Host|Outlet|Content|Trigger)$/;

const problems = [];
const rel = (path) => relativePosix(root, path);

for (const path of walk(join(root, 'src'), { directories: true })) {
  const name = basename(path);
  if (!KEBAB.test(name))
    problems.push(`${rel(path)}: file and directory names are kebab-case (N1)`);
}

function specRoots(specPath) {
  const text = readFileSync(specPath, 'utf8');
  const hooks = text.slice(text.indexOf('## Hooks'));
  return [...hooks.matchAll(/^\|\s*`(ui-[a-z0-9-]+)`\s*\|\s*root\s*\|/gm)].map((match) => match[1]);
}

const components = existsSync(componentsDir)
  ? readdirSync(componentsDir).filter((name) => statSync(join(componentsDir, name)).isDirectory())
  : [];

for (const name of components) {
  const dir = join(componentsDir, name);
  const main = ['tsx', 'ts'].map((ext) => join(dir, `${name}.${ext}`)).find(existsSync);
  const index = join(dir, 'index.ts');
  if (!main) problems.push(`src/components/${name}: missing main module ${name}.tsx (S2)`);
  if (!existsSync(index)) problems.push(`src/components/${name}: missing index.ts (S2)`);
  if (main && !['test.tsx', 'test.ts'].some((ext) => existsSync(join(dir, `${name}.${ext}`)))) {
    problems.push(`src/components/${name}: missing unit test ${name}.test.tsx (S5)`);
  }
  if (existsSync(index)) {
    const source = ts.createSourceFile(index, readFileSync(index, 'utf8'), ts.ScriptTarget.Latest);
    for (const statement of source.statements) {
      if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) {
        problems.push(`src/components/${name}/index.ts: only \`export … from\` statements (S3)`);
        break;
      }
    }
  }
  const spec = join(root, 'specs', `${name.toUpperCase()}.md`);
  if (!existsSync(spec))
    problems.push(`src/components/${name}: missing specs/${name.toUpperCase()}.md (N2)`);
  if (!existsSync(join(root, 'labs', 'src', `${name}.lab.tsx`))) {
    problems.push(`src/components/${name}: missing labs/src/${name}.lab.tsx (N2)`);
  }
  if (!existsSync(join(root, 'e2e', `${name}.spec.ts`))) {
    problems.push(`src/components/${name}: missing e2e/${name}.spec.ts (N2)`);
  }
  if (existsSync(spec)) {
    const roots = specRoots(spec);
    const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, _dash, letter) => letter.toUpperCase());
    const exportsNamesake =
      existsSync(index) && new RegExp(`\\b${pascal}\\b`).test(readFileSync(index, 'utf8'));
    if (exportsNamesake && roots.length > 0 && !roots.includes(`ui-${name}`)) {
      problems.push(
        `specs/${name.toUpperCase()}.md: the root hook of ${pascal} is ui-${name} (N2)`,
      );
    }
    const partial = join(root, 'labs', 'reference', `${name}.css`);
    if (roots.length > 0) {
      if (!existsSync(partial)) {
        problems.push(`src/components/${name}: missing labs/reference/${name}.css (N2)`);
      } else {
        const css = readFileSync(partial, 'utf8');
        for (const hook of roots) {
          if (!new RegExp(`\\.${hook}(?![a-z0-9_-])`).test(css)) {
            problems.push(`labs/reference/${name}.css: does not style its own root ${hook} (S5)`);
          }
        }
      }
    }
  }
}

// I2: props inherit BaseProps instead of redeclaring caller data attributes.
for (const path of walk(join(root, 'src'))) {
  if (!/\.tsx?$/.test(path) || /\.test\.tsx?$/.test(path) || rel(path).startsWith('src/core/'))
    continue;
  if (/\[\w+: `data-\$\{string\}`\]\s*:/.test(readFileSync(path, 'utf8'))) {
    problems.push(
      `${rel(path)}: extend BaseProps instead of declaring a data-* index signature (I2)`,
    );
  }
}

// N8: one createHooks call per component name, so its hook surface is declared in one list.
const hookDeclarations = new Map();
for (const path of walk(join(root, 'src'))) {
  if (!/\.tsx?$/.test(path) || /\.test\.tsx?$/.test(path)) continue;
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest);
  const visit = (node) => {
    const name = ts.isCallExpression(node) ? node.arguments[0] : undefined;
    const isCreateHooks =
      name && ts.isIdentifier(node.expression) && node.expression.text === 'createHooks';
    if (isCreateHooks && ts.isStringLiteral(name)) {
      const first = hookDeclarations.get(name.text);
      if (first) {
        problems.push(
          `${rel(path)}: createHooks('${name.text}') is declared in ${first} too; share one <name>-hooks.ts (N8)`,
        );
      } else hookDeclarations.set(name.text, rel(path));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

// S8: no runtime import cycle spans two component directories. Type-only imports are erased, so
// they are left out of the graph.
/** Whether an import or export statement brings in types only, which compile away. */
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

function runtimeImports(path) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest);
  const targets = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith('.')) continue;
    if (isTypeOnly(statement)) continue;
    const base = join(path, '..', specifier.text.replace(/\.js$/, ''));
    const found = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(existsSync);
    if (found) targets.push(found);
  }
  return targets;
}

function findCycles(graph) {
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

const importGraph = new Map();
for (const path of walk(join(root, 'src'))) {
  if (/\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path))
    importGraph.set(path, runtimeImports(path));
}
const componentOf = (path) =>
  path.startsWith(componentsDir + sep) ? path.slice(componentsDir.length + 1).split(sep)[0] : null;
for (const cycle of findCycles(importGraph)) {
  const owners = new Set(cycle.map(componentOf));
  if (owners.size < 2) continue;
  const members = cycle.map(rel).sort().join(', ');
  problems.push(`import cycle between components: ${members} (S8)`);
}

// I2: every exported component that renders an element takes props that include BaseProps.
const config = ts.getParsedCommandLineOfConfigFile(
  join(root, 'tsconfig.json'),
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {},
  },
);
const indexFiles = components
  .map((name) => join(componentsDir, name, 'index.ts'))
  .filter(existsSync);
const program = ts.createProgram(indexFiles, config?.options ?? {});
const checker = program.getTypeChecker();

function includesBaseProps(type) {
  const parts = type.isUnion() ? type.types : [type];
  return parts.every((part) => {
    const hasClassName = Boolean(checker.getPropertyOfType(part, 'className'));
    const hasData = checker
      .getIndexInfosOfType(part)
      .some((info) => checker.typeToString(info.keyType) === '`data-${string}`');
    return hasClassName && hasData;
  });
}

for (const file of indexFiles) {
  const source = program.getSourceFile(file);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) continue;
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const name = exported.getName();
    if (!/^[A-Z]/.test(name) || NO_ELEMENT.test(name)) continue;
    const symbol =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (!(symbol.flags & ts.SymbolFlags.Function)) continue;
    const declaration = symbol.valueDeclaration;
    if (!declaration) continue;
    const signature = checker.getSignaturesOfType(
      checker.getTypeOfSymbolAtLocation(symbol, declaration),
      ts.SignatureKind.Call,
    )[0];
    const props = signature?.getParameters()[0];
    if (!props) continue;
    const returns = checker.typeToString(signature.getReturnType());
    if (!/Element|ReactNode/.test(returns)) continue;
    if (!includesBaseProps(checker.getTypeOfSymbolAtLocation(props, declaration))) {
      problems.push(
        `${rel(file).replace('/index.ts', '')}: ${name} props must extend BaseProps (I2)`,
      );
    }
  }
}

reportProblems(problems, {
  heading: 'Structure problems (docs/CODING-GUIDELINES.md)',
  success: `${components.length} component directories follow the structure rules.`,
});
