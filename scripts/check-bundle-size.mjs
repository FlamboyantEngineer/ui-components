#!/usr/bin/env node
// Bundles a small matrix of consumers of the packed package under production webpack and checks
// each against its budget in `scripts/bundle-budgets.json` (UIC-LABS-1.8): the initial code's raw
// and gzipped size, which modules a simple consumer must leave out, and which a feature must hold.
// React stays external, as a host provides it. `--update` writes the measured sizes as the new
// baselines; `--report <file>` writes every measurement and its module attribution as JSON.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  attributeModules,
  compareBudgets,
  forbiddenModules,
  measureCode,
  updatedBudgets,
} from './lib/bundle-budgets.mjs';
import { bundleConsumer, installPackedConsumer } from './lib/consumer-bundle.mjs';
import { REFERENCE_STYLESHEET } from './lib/reference-stylesheet.mjs';
import { reportProblems, root } from './lib/script.mjs';

const BUDGETS = join(root, 'scripts/bundle-budgets.json');
const PACKAGE = '@flamboyantengineer/ui-components';
const EXTERNALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
  'react/jsx-runtime': 'ReactJSXRuntime',
};

// What a consumer drawing plain controls must never bundle, eagerly or as a lazy chunk.
const HEAVY = [
  'prosemirror',
  'react-reconciler',
  '@handlewithcare',
  'pdfjs-dist',
  'katex',
  `${PACKAGE}/dist/core/locales/(?!index|en)`,
  `${PACKAGE}/dist/components/(?:rich-text-editor|pdf-viewer|math-preview|code-editor)/`,
];

const use = (names, from) => `import { ${names.join(', ')} } from '${from}';
globalThis.used = [${names.join(', ')}];`;

const CONSUMERS = [
  { name: 'button-root', entry: use(['Button'], PACKAGE), excludes: HEAVY },
  { name: 'button', entry: use(['Button'], `${PACKAGE}/button`), excludes: HEAVY },
  {
    name: 'button-with-reference-css',
    entry: `import '${PACKAGE}/reference.css';\n${use(['Button'], `${PACKAGE}/button`)}`,
    excludes: HEAVY,
    contains: ['.ui-button', '@layer ui-reference'],
  },
  { name: 'text-field', entry: use(['TextField'], `${PACKAGE}/text-field`), excludes: HEAVY },
  { name: 'table', entry: use(['Table'], `${PACKAGE}/table`), excludes: HEAVY },
  { name: 'markdown', entry: use(['Markdown'], `${PACKAGE}/markdown`), excludes: HEAVY },
  {
    name: 'rich-text-editor',
    entry: use(['RichTextEditor'], `${PACKAGE}/rich-text-editor`),
    includes: ['prosemirror-view'],
  },
  {
    name: 'pdf-viewer',
    // The host hands the viewer its engine, loaded as a chunk of its own.
    entry: `${use(['PdfViewer'], `${PACKAGE}/pdf-viewer`)}
globalThis.loadEngine = () => import('pdfjs-dist');`,
    includes: ['pdfjs-dist'],
  },
  {
    name: 'math-preview',
    entry: use(['MathPreview'], `${PACKAGE}/math-preview`),
    includes: ['katex'],
  },
];

const flag = (name) => process.argv.indexOf(name);
const shouldUpdate = flag('--update') !== -1;
const reportPath =
  flag('--report') === -1 ? undefined : resolve(process.argv[flag('--report') + 1] ?? '');

for (const built of ['dist/index.js', REFERENCE_STYLESHEET]) {
  if (!existsSync(join(root, built))) {
    console.error(
      `${built} is missing: run \`npm run build:package\` before checking bundle sizes.`,
    );
    process.exit(1);
  }
}

const budgets = JSON.parse(readFileSync(BUDGETS, 'utf8'));
const problems = [];
const measured = {};
const report = {};
const workDir = mkdtempSync(join(tmpdir(), 'ui-bundle-size-'));

try {
  installPackedConsumer(workDir);
  for (const consumer of CONSUMERS) {
    const { code, chunks } = await bundleConsumer(workDir, consumer.entry, {
      externals: EXTERNALS,
      name: consumer.name,
    });
    const initialModules = chunks
      .filter((chunk) => chunk.initial)
      .flatMap((chunk) => chunk.modules);
    const allModules = chunks.flatMap((chunk) => chunk.modules);
    const sizes = measureCode(code);
    const lazy = chunks.filter((chunk) => !chunk.initial);
    measured[consumer.name] = sizes;
    report[consumer.name] = {
      ...sizes,
      lazyChunks: lazy.length,
      lazyRaw: lazy.reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0),
      owners: attributeModules(initialModules),
    };
    for (const name of forbiddenModules(allModules, consumer.excludes ?? []).slice(0, 5)) {
      problems.push(`${consumer.name} bundles ${name}, which a simple consumer must leave out`);
    }
    for (const pattern of consumer.includes ?? []) {
      if (forbiddenModules(allModules, [pattern]).length === 0) {
        problems.push(
          `${consumer.name} holds no ${pattern} module; the consumer no longer measures it`,
        );
      }
    }
    for (const text of consumer.contains ?? []) {
      if (!code.includes(text)) problems.push(`${consumer.name} lost ${text} from its bundle`);
    }
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`.padStart(10);
for (const [name, { raw, gzip, lazyChunks, lazyRaw }] of Object.entries(report)) {
  const lazy = lazyChunks ? `  + ${lazyChunks} lazy chunks ${kb(lazyRaw).trim()}` : '';
  console.log(`${name.padEnd(28)}${kb(raw)} raw${kb(gzip)} gzip${lazy}`);
}
if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (shouldUpdate) {
  writeFileSync(BUDGETS, `${JSON.stringify(updatedBudgets(measured, budgets), null, 2)}\n`);
  console.log(
    `\nWrote the measured baselines to ${BUDGETS}; review the change before committing it.`,
  );
} else {
  const comparison = compareBudgets(measured, budgets);
  for (const note of comparison.notes) {
    console.log(`note: ${note}; lower its baseline with \`npm run check:bundle-size -- --update\``);
  }
  for (const problem of comparison.problems) {
    const consumer = problem.split(' ')[0] ?? '';
    const owners = report[consumer]?.owners.slice(0, 8) ?? [];
    problems.push(
      owners.length === 0
        ? problem
        : `${problem}. Largest modules by owner, before minifying:\n${owners
            .map(({ owner, size }) => `      ${kb(size)}  ${owner}`)
            .join('\n')}`,
    );
  }
}

reportProblems(problems, {
  heading: 'Consumer bundle problems',
  hint: 'A deliberate size change updates the baselines: `npm run check:bundle-size -- --update`.',
  success: `${CONSUMERS.length} consumer bundles are within their budgets.`,
});
