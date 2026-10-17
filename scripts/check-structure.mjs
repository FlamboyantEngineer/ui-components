#!/usr/bin/env node
// Enforces the structural rules of docs/CODING-GUIDELINES.md that lint cannot see:
//   N1 kebab-case files, N2/S5 one name per component across spec, lab, test and partial (a
//   directory may hold a family of components without a namesake, such as layout primitives),
//   S2 component directory layout, S3 re-export-only entry points, I2 props that extend BaseProps.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const componentsDir = join(root, 'src', 'components');
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+)*$/;
// Components that render no element of their own: they provide context, portal or relay content.
const NO_ELEMENT = /(?:Provider|Host|Outlet|Content|Trigger)$/;

const problems = [];
const rel = (path) => relative(root, path);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? [full, ...walk(full)] : [full];
  });
}

for (const path of walk(join(root, 'src'))) {
  const name = path.split('/').at(-1);
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
  if (!/\.tsx?$/.test(path) || /\.test\.tsx?$/.test(path) || path.includes('/src/core/')) continue;
  if (/\[\w+: `data-\$\{string\}`\]\s*:/.test(readFileSync(path, 'utf8'))) {
    problems.push(
      `${rel(path)}: extend BaseProps instead of declaring a data-* index signature (I2)`,
    );
  }
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
const program = ts.createProgram(indexFiles, config.options);
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
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(file));
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

if (problems.length > 0) {
  console.error('Structure problems (docs/CODING-GUIDELINES.md):');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`${components.length} component directories follow the structure rules.`);
