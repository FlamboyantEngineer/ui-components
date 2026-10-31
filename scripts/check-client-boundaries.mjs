#!/usr/bin/env node
// Checks the client boundaries of specs/SERVER-COMPONENTS.md: a source module starts with the
// 'use client' directive exactly when it needs the browser runtime of React, so a server component
// can import any entry point and server-safe utilities stay callable on the server.
// `--fix` adds and removes the directives to match.
//
// A module needs the client when it uses a React API the server build of React leaves out (state,
// effects, refs, context), calls a hook, imports React DOM or a client package (React Aria), or
// writes a function into JSX (an event handler, a render function). A module that renders a client
// component needs the client too, since the props it passes may hold functions, and so does a
// module that calls or reads a client module's export: on the server that export is a client
// reference, which renders as a tag or travels as a component but holds no value. No module
// re-exports a client module with `export *`, which a framework cannot resolve across the boundary.
//
// An entry point (`index.ts`) exports a value through a client module only when the value is client
// code: a component, a hook or a helper in CLIENT_HELPERS, which needs the browser. Every other
// helper is defined in a server-safe module and exported from there, so a server component can call
// it rather than receive a client reference.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIRECTIVE = "'use client';";
// The exports of React's server build (react.react-server).
const SERVER_REACT = new Set([
  'Activity',
  'Children',
  'Fragment',
  'Profiler',
  'StrictMode',
  'Suspense',
  'ViewTransition',
  'cache',
  'cacheSignal',
  'captureOwnerStack',
  'cloneElement',
  'createElement',
  'createRef',
  'forwardRef',
  'isValidElement',
  'lazy',
  'memo',
  'use',
  'useCallback',
  'useDebugValue',
  'useId',
  'useMemo',
  'version',
]);
const CLIENT_PACKAGE =
  /^(react-dom(\/client)?|react-aria|react-aria\/.+|react-aria-components|react-stately|@react-aria\/.+|@react-stately\/.+|@handlewithcare\/react-prosemirror)$/;
const HOOK = /^use[A-Z]/;
const COMPONENT = /^[A-Z](?=.*[a-z])[A-Za-z0-9]*$/;
// Public helpers that need the browser: they open overlays, keep client state or read the DOM.
const CLIENT_HELPERS = new Set([
  'alert',
  'armHandleDrag',
  'confirm',
  'createCitationOverride',
  'createCodeBlockOverride',
  'createMenuController',
  'createModalController',
  'createToastQueue',
  'getFieldUndo',
  'keepHandleCellDraggable',
  'prompt',
  'resolveScrollSpy',
]);
const SERVER_HOOKS = new Set(['useCallback', 'useDebugValue', 'useId', 'useMemo']);
const fix = process.argv.includes('--fix');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** The module a declaration imports or re-exports from; the caller has checked it names one. */
const specifierOf = (statement) =>
  /** @type {import('typescript').StringLiteral} */ (statement.moduleSpecifier).text;

const isFunction = (node) =>
  node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

function hasDirective(source) {
  const [first] = source.statements;
  return (
    first !== undefined &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === 'use client'
  );
}

/** Value names a declaration imports or re-exports from its module, skipping type-only ones. */
function valueNames(statement) {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) return clause ? [] : ['*'];
    const names = clause.name ? ['default'] : [];
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) names.push('*');
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (!element.isTypeOnly) names.push((element.propertyName ?? element.name).text);
      }
    }
    return names;
  }
  if (statement.isTypeOnly) return [];
  const clause = statement.exportClause;
  if (!clause || !ts.isNamedExports(clause)) return ['*'];
  return clause.elements
    .filter((element) => !element.isTypeOnly)
    .map((element) => (element.propertyName ?? element.name).text);
}

/** Why a module needs the client, or null when it runs on the server. */
function clientReason(source) {
  for (const statement of source.statements) {
    const isModuleStatement =
      ts.isImportDeclaration(statement) ||
      (ts.isExportDeclaration(statement) && statement.moduleSpecifier);
    if (!isModuleStatement) continue;
    const from = specifierOf(statement);
    const names = valueNames(statement);
    if (names.length === 0) continue;
    if (CLIENT_PACKAGE.test(from)) return `imports ${from}`;
    const clientApi = names.find((name) => !SERVER_REACT.has(name));
    if (from === 'react' && clientApi) return `imports ${clientApi} from react`;
  }
  let reason = null;
  const visit = (node) => {
    if (reason) return;
    if (ts.isCallExpression(node)) {
      const callee = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name
        : node.expression;
      if (ts.isIdentifier(callee) && HOOK.test(callee.text) && !SERVER_HOOKS.has(callee.text)) {
        reason = `calls ${callee.text}`;
      }
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      const value = node.initializer && ts.isJsxExpression(node.initializer);
      if (/^on[A-Z]/.test(name) || (value && isFunction(node.initializer.expression))) {
        reason = `passes a function to ${name}`;
      }
    } else if (
      ts.isJsxExpression(node) &&
      ts.isJsxElement(node.parent) &&
      isFunction(node.expression)
    ) {
      reason = 'passes a function as JSX children';
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return reason;
}

const modules = new Map();
for (const path of walk(join(root, 'src'))) {
  const text = readFileSync(path, 'utf8');
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
  modules.set(path, { path, text, source, reason: clientReason(source) });
}

/** The source file a relative module specifier names, or null for a package. */
function resolveModule(from, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(from), specifier).replace(/\.js$/, '');
  return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(existsSync) ?? null;
}

/** Whether a module declares an export of that name, or re-exports it from a package. */
function declares(source, name) {
  return source.statements.some((statement) => {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      const isLocal = !statement.moduleSpecifier || !specifierOf(statement).startsWith('.');
      return (
        isLocal &&
        clause !== undefined &&
        ts.isNamedExports(clause) &&
        clause.elements.some((element) => element.name.text === name)
      );
    }
    const isExported = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement)?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword)
      : false;
    if (!isExported) return false;
    if (ts.isVariableStatement(statement)) {
      return statement.declarationList.declarations.some(
        (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name,
      );
    }
    return statement.name?.text === name;
  });
}

/** The module that defines an export, following re-exports through entry points, or null. */
function definingModule(path, name, seen = new Set()) {
  const module = modules.get(path);
  if (!module || seen.has(path)) return null;
  seen.add(path);
  if (declares(module.source, name)) return path;
  for (const statement of module.source.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue;
    const target = resolveModule(path, specifierOf(statement));
    const clause = statement.exportClause;
    if (!target) continue;
    if (!clause) {
      const found = definingModule(target, name, seen);
      if (found) return found;
    } else if (ts.isNamedExports(clause)) {
      const element = clause.elements.find((item) => item.name.text === name);
      if (element) return definingModule(target, (element.propertyName ?? element.name).text);
    }
  }
  return null;
}

/** The modules a module's value imports come from, by local name, with the exports they name. */
function importedValues(module) {
  const imports = new Map();
  for (const statement of module.source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) continue;
    const target = resolveModule(module.path, specifierOf(statement));
    const bindings = statement.importClause?.namedBindings;
    if (!target || !bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if (element.isTypeOnly) continue;
      const name = (element.propertyName ?? element.name).text;
      imports.set(element.name.text, { name, origin: definingModule(target, name) });
    }
  }
  return imports;
}

const isTagName = (node) =>
  (ts.isJsxOpeningElement(node.parent) ||
    ts.isJsxSelfClosingElement(node.parent) ||
    ts.isJsxClosingElement(node.parent)) &&
  node.parent.tagName === node;

/**
 * The imported exports a module uses other than as a JSX tag or a component reference: called,
 * read or passed on. On the server, an export of a client module is a client reference, which
 * renders as a tag or travels as a component prop but holds no value to call or read.
 */
function valueUses(module, imports) {
  const used = new Map();
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isTypeNode(node)) return;
    if (ts.isIdentifier(node) && imports.has(node.text) && !isTagName(node)) {
      const binding = imports.get(node.text);
      const isMemberName = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
      const isCalled = ts.isCallExpression(node.parent) && node.parent.expression === node;
      const isReference = COMPONENT.test(binding.name) && !isCalled;
      if (!isMemberName && !isReference) used.set(node.text, binding);
    }
    ts.forEachChild(node, visit);
  };
  visit(module.source);
  return [...used.values()];
}

/** The modules that define the components a module renders, by their JSX tag names. */
function renderedModules(module, imports) {
  const rendered = new Set();
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      let tag = node.tagName;
      while (ts.isPropertyAccessExpression(tag)) tag = tag.expression;
      const binding = ts.isIdentifier(tag) ? imports.get(tag.text) : undefined;
      if (binding) rendered.add(binding.origin);
    }
    ts.forEachChild(node, visit);
  };
  visit(module.source);
  return [...rendered].filter(Boolean);
}

for (const module of modules.values()) {
  const imports = importedValues(module);
  module.rendered = renderedModules(module, imports);
  module.used = valueUses(module, imports).filter((use) => use.origin);
}
for (let changed = true; changed; ) {
  changed = false;
  for (const module of modules.values()) {
    if (module.reason) continue;
    const client = module.rendered.find((path) => modules.get(path)?.reason);
    const use = module.used.find(({ origin }) => modules.get(origin)?.reason);
    if (client) {
      module.reason = `renders a client component from ${relative(root, client)}`;
    } else if (use) {
      module.reason = `uses ${use.name} from client ${relative(root, use.origin)} as a value`;
    }
    changed ||= Boolean(module.reason);
  }
}

const problems = [];
for (const { path, text, source, reason } of modules.values()) {
  const marked = hasDirective(source);
  const name = relative(root, path);
  const starred = source.statements
    .filter((s) => ts.isExportDeclaration(s) && !s.exportClause && s.moduleSpecifier)
    .map((s) => resolveModule(path, specifierOf(s)));
  if (reason && starred.length > 0) {
    problems.push(`${name}: a client module re-exports with \`export *\``);
  }
  for (const target of starred.filter((item) => modules.get(item)?.reason)) {
    problems.push(`${name}: re-exports client ${relative(root, target)} with \`export *\``);
  }
  if (Boolean(reason) === marked) continue;
  if (fix) {
    writeFileSync(
      path,
      marked ? text.replace(/^'use client';\n\n?/, '') : `${DIRECTIVE}\n\n${text}`,
    );
  } else if (reason) {
    problems.push(`${name}: ${reason}, so it starts with ${DIRECTIVE}`);
  } else {
    problems.push(`${name}: runs on the server, so it drops ${DIRECTIVE}`);
  }
}

// The package's entry points; the building blocks under src/primitives are internal.
const isEntryPoint = (path) =>
  basename(path) === 'index.ts' && !relative(root, path).startsWith(join('src', 'primitives'));

for (const { path, source } of modules.values()) {
  if (!isEntryPoint(path)) continue;
  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement) || statement.isTypeOnly || !statement.moduleSpecifier) {
      continue;
    }
    const target = resolveModule(path, specifierOf(statement));
    const clause = statement.exportClause;
    if (!target || !modules.get(target)?.reason || !clause || !ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      if (element.isTypeOnly) continue;
      const name = (element.propertyName ?? element.name).text;
      const origin = definingModule(target, name);
      const entry = relative(root, path);
      if (origin && !modules.get(origin)?.reason) {
        problems.push(
          `${entry}: exports ${name} through client ${relative(root, target)}; export it from ${relative(root, origin)}`,
        );
      } else if (!COMPONENT.test(name) && !HOOK.test(name) && !CLIENT_HELPERS.has(name)) {
        problems.push(
          `${entry}: ${name} is defined in client ${relative(root, target)}; move it to a server-safe module`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} client boundary problem(s). \`--fix\` adds the directives.`);
  process.exit(1);
}
console.log(fix ? 'Client boundaries fixed.' : 'Client boundaries match.');
