// The structural rules of docs/CODING-GUIDELINES.md that only this repository has, which the shared
// structure check (`ui-components-tooling check-structure`) runs through tooling.config.mjs:
//   N2/S5 one name per component across spec, lab, test and partial (a directory may hold a family
//   of components without a namesake, such as layout primitives), S2 component directory layout,
//   I2 props that extend BaseProps and N8 one createHooks declaration per component, and that the
//   shared tooling stays apart from the library (UIC-TOOLING-1.1).

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { moduleImports, parseModule } from '../tooling/lib/imports.mjs';
import { relativePosix, walk } from '../tooling/lib/script.mjs';
import { ROOTLESS } from './lib/root-refs.mjs';

// Components that render no element of their own: they provide context, portal or relay content.
const NO_ELEMENT = /(?:Provider|Host|Outlet|Content|Trigger)$/;
const SOURCE = /\.tsx?$/;
const TEST = /\.test\.tsx?$/;
const TOOLING_SPECIFIER = /^@flamboyantengineer\/ui-components\/tooling(?:\/|$)/;
// What tooling must not load: React, and the library's source or build.
const LIBRARY_SPECIFIER =
  /^(?:react(?:-dom)?(?:\/|$)|@flamboyantengineer\/ui-components(?!\/tooling)|\.\.\/(?:src|dist)\/)/;

function specRoots(specPath) {
  const text = readFileSync(specPath, 'utf8');
  const hooks = text.slice(text.indexOf('## Hooks'));
  return [...hooks.matchAll(/^\|\s*`(ui-[a-z0-9-]+)`\s*\|\s*root\s*\|/gm)].map((match) => match[1]);
}

/** S2, S5 and N2: the files a component directory holds and the files named after it. */
function checkComponentFiles(root, name, problems) {
  const dir = join(root, 'src', 'components', name);
  const main = ['tsx', 'ts'].map((ext) => join(dir, `${name}.${ext}`)).find(existsSync);
  if (!main) problems.push(`src/components/${name}: missing main module ${name}.tsx (S2)`);
  if (!existsSync(join(dir, 'index.ts')))
    problems.push(`src/components/${name}: missing index.ts (S2)`);
  if (main && !['test.tsx', 'test.ts'].some((ext) => existsSync(join(dir, `${name}.${ext}`)))) {
    problems.push(`src/components/${name}: missing unit test ${name}.test.tsx (S5)`);
  }
  if (!existsSync(join(root, 'specs', `${name.toUpperCase()}.md`)))
    problems.push(`src/components/${name}: missing specs/${name.toUpperCase()}.md (N2)`);
  if (!existsSync(join(root, 'labs', 'src', `${name}.lab.tsx`))) {
    problems.push(`src/components/${name}: missing labs/src/${name}.lab.tsx (N2)`);
  }
  if (!existsSync(join(root, 'e2e', `${name}.spec.ts`))) {
    problems.push(`src/components/${name}: missing e2e/${name}.spec.ts (N2)`);
  }
}

/** N2 and S5: the root hook a component's spec declares, and the reference partial that styles it. */
function checkComponentHooks(root, name, problems) {
  const spec = join(root, 'specs', `${name.toUpperCase()}.md`);
  if (!existsSync(spec)) return;
  const index = join(root, 'src', 'components', name, 'index.ts');
  const roots = specRoots(spec);
  const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, _dash, letter) => letter.toUpperCase());
  const exportsNamesake =
    existsSync(index) && new RegExp(`\\b${pascal}\\b`).test(readFileSync(index, 'utf8'));
  if (exportsNamesake && roots.length > 0 && !roots.includes(`ui-${name}`)) {
    problems.push(`specs/${name.toUpperCase()}.md: the root hook of ${pascal} is ui-${name} (N2)`);
  }
  if (roots.length === 0) return;
  const partial = join(root, 'labs', 'reference', `${name}.css`);
  if (!existsSync(partial)) {
    problems.push(`src/components/${name}: missing labs/reference/${name}.css (N2)`);
    return;
  }
  const css = readFileSync(partial, 'utf8');
  for (const hook of roots) {
    if (!new RegExp(`\\.${hook}(?![a-z0-9_-])`).test(css)) {
      problems.push(`labs/reference/${name}.css: does not style its own root ${hook} (S5)`);
    }
  }
}

/** N8: one createHooks call per component name, so its hook surface is declared in one list. */
function checkHookDeclarations(root, sources, problems) {
  const declarations = new Map();
  for (const path of sources) {
    const visit = (node) => {
      const name = ts.isCallExpression(node) ? node.arguments[0] : undefined;
      const isCreateHooks =
        name && ts.isIdentifier(node.expression) && node.expression.text === 'createHooks';
      if (isCreateHooks && ts.isStringLiteral(name)) {
        const first = declarations.get(name.text);
        const at = relativePosix(root, path);
        if (first) {
          problems.push(
            `${at}: createHooks('${name.text}') is declared in ${first} too; share one <name>-hooks.ts (N8)`,
          );
        } else declarations.set(name.text, at);
      }
      ts.forEachChild(node, visit);
    };
    visit(parseModule(path));
  }
}

/** I2: every exported component that renders an element takes props that include BaseProps. */
function checkBaseProps(root, indexFiles, problems) {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(root, 'tsconfig.json'),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
  );
  const program = ts.createProgram(indexFiles, config?.options ?? {});
  const checker = program.getTypeChecker();
  const includesBaseProps = (type) =>
    (type.isUnion() ? type.types : [type]).every((part) => {
      const hasClassName = Boolean(checker.getPropertyOfType(part, 'className'));
      const hasData = checker
        .getIndexInfosOfType(part)
        .some((info) => checker.typeToString(info.keyType) === '`data-${string}`');
      return hasClassName && hasData;
    });
  for (const file of indexFiles) {
    const source = program.getSourceFile(file);
    const moduleSymbol = source && checker.getSymbolAtLocation(source);
    if (!moduleSymbol) continue;
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const name = exported.getName();
      if (!/^[A-Z]/.test(name) || NO_ELEMENT.test(name) || ROOTLESS.has(name)) continue;
      const symbol =
        exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const declaration = symbol.flags & ts.SymbolFlags.Function ? symbol.valueDeclaration : null;
      if (!declaration) continue;
      const signature = checker.getSignaturesOfType(
        checker.getTypeOfSymbolAtLocation(symbol, declaration),
        ts.SignatureKind.Call,
      )[0];
      const props = signature?.getParameters()[0];
      if (!props || !/Element|ReactNode/.test(checker.typeToString(signature.getReturnType())))
        continue;
      if (!includesBaseProps(checker.getTypeOfSymbolAtLocation(props, declaration))) {
        const dir = relativePosix(root, file).replace('/index.ts', '');
        problems.push(`${dir}: ${name} props must extend BaseProps (I2)`);
      }
    }
  }
}

/** UIC-TOOLING-1.1: library source never loads tooling, and tooling never loads the library. */
function checkToolingIsolation(root, sources, problems) {
  for (const path of sources) {
    for (const { specifier } of moduleImports(parseModule(path))) {
      if (TOOLING_SPECIFIER.test(specifier)) {
        problems.push(`${relativePosix(root, path)}: library source cannot import ${specifier}`);
      }
    }
  }
  const toolingDir = join(root, 'tooling');
  const tooling = existsSync(toolingDir) ? walk(toolingDir) : [];
  for (const path of tooling.filter((file) => file.endsWith('.mjs'))) {
    for (const { specifier } of moduleImports(parseModule(path))) {
      if (LIBRARY_SPECIFIER.test(specifier) || specifier.includes('/src/')) {
        problems.push(
          `${relativePosix(root, path)}: tooling cannot import ${specifier} (UIC-TOOLING-1.1)`,
        );
      }
    }
  }
}

/**
 * The problems of this repository's own structure rules.
 * @param {{ root: string }} context
 * @returns {string[]}
 */
export function checkComponentStructure({ root }) {
  const problems = [];
  const componentsDir = join(root, 'src', 'components');
  const components = existsSync(componentsDir)
    ? readdirSync(componentsDir).filter((name) => statSync(join(componentsDir, name)).isDirectory())
    : [];
  for (const name of components) {
    checkComponentFiles(root, name, problems);
    checkComponentHooks(root, name, problems);
  }
  const sources = walk(join(root, 'src')).filter((path) => SOURCE.test(path) && !TEST.test(path));
  // I2: props inherit BaseProps instead of redeclaring caller data attributes.
  for (const path of sources) {
    const at = relativePosix(root, path);
    if (at.startsWith('src/core/')) continue;
    if (/\[\w+: `data-\$\{string\}`\]\s*:/.test(readFileSync(path, 'utf8'))) {
      problems.push(`${at}: extend BaseProps instead of declaring a data-* index signature (I2)`);
    }
  }
  checkHookDeclarations(root, sources, problems);
  checkToolingIsolation(root, sources, problems);
  const indexFiles = components
    .map((name) => join(componentsDir, name, 'index.ts'))
    .filter((path) => existsSync(path));
  checkBaseProps(root, indexFiles, problems);
  return problems;
}
