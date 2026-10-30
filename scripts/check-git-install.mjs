#!/usr/bin/env node
// Installs the package as an npm Git dependency into a clean temporary consumer, as a host installs a
// branch, and checks what npm prepared: the root and component entry points import and render with
// the minimum supported React, the public declarations type-check, labs are excluded and no optional
// rich-text peer is installed. Then it deletes node_modules and repeats the checks through `npm ci`
// with the consumer's lockfile. Last, it adds the rich-text peers at their minimum versions, without
// relaxing npm's peer resolution, and renders the rich text editor. Each install
// uses an empty npm cache, so npm clones and prepares the package from source both times.
// The default is this checkout's HEAD commit, so commit the changes to check first. Git reads a
// private repository through its usual credential helpers.
//   node scripts/check-git-install.mjs [<git dependency>]
//   node scripts/check-git-install.mjs "git+https://github.com/FlamboyantEngineer/ui-components.git#dev"

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACKAGE = '@flamboyantengineer/ui-components';
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const { peerDependencies } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** The lowest version a peer range admits; the ranges are a caret range or one exact version. */
function minimum(name) {
  const version = /^\^?(\d+\.\d+\.\d+)$/.exec(peerDependencies[name])?.[1];
  if (!version)
    throw new Error(`The ${name} peer range ${peerDependencies[name]} has no plain minimum`);
  return `${name}@${version}`;
}

const corePeers = ['react', 'react-dom'];
const richTextPeers = [
  '@handlewithcare/react-prosemirror',
  'react-reconciler',
  ...Object.keys(peerDependencies).filter((name) => name.startsWith('prosemirror-')),
];

const dependency =
  process.argv[2] ??
  `git+file://${root}#${execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()}`;
const workDir = mkdtempSync(join(tmpdir(), 'ui-git-install-'));
const consumer = join(workDir, 'consumer');

const files = {
  'package.json': JSON.stringify({ name: 'git-install-consumer', private: true, type: 'module' }),
  'render.mjs': `
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as library from '${PACKAGE}';
import { Button } from '${PACKAGE}/button';

const markup = renderToStaticMarkup(createElement(Button, null, 'Save'));
if (library.Button !== Button || !markup.includes('ui-button') || !markup.includes('Save')) {
  throw new Error('Button rendered ' + markup);
}
`,
  'render-rich-text.mjs': `
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichTextEditor } from '${PACKAGE}/rich-text-editor';

const markup = renderToStaticMarkup(createElement(RichTextEditor, { label: 'Notes' }));
if (!markup.includes('ui-rich-text-editor') || !markup.includes('ProseMirror')) {
  throw new Error('RichTextEditor rendered ' + markup);
}
`,
  'consumer.ts': `
import type { ComponentProps } from 'react';
import { UiProvider } from '${PACKAGE}';
import { Button } from '${PACKAGE}/button';

export const provider: typeof UiProvider = UiProvider;
export const props: ComponentProps<typeof Button> = { children: 'Save', variant: 'primary' };
// @ts-expect-error The declarations type the props, so an unknown prop fails.
export const unknown: ComponentProps<typeof Button> = { notAProp: true };
`,
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    files: ['consumer.ts'],
  }),
};

const problems = [];

function npm(args) {
  execFileSync('npm', [...args, '--no-audit', '--no-fund'], {
    cwd: consumer,
    stdio: 'inherit',
    // An empty cache per install, so npm prepares the package instead of reusing a packed copy.
    env: { ...process.env, npm_config_cache: mkdtempSync(join(workDir, 'cache-')) },
  });
}

function check(phase) {
  const installed = join(consumer, 'node_modules', ...PACKAGE.split('/'));
  for (const file of ['dist/index.js', 'dist/index.d.ts']) {
    const path = join(installed, file);
    if (!existsSync(path) || statSync(path).size === 0) {
      problems.push(`${phase}: the installed package is missing ${file}`);
    }
  }
  if (existsSync(join(installed, 'labs')))
    problems.push(`${phase}: the installed package contains labs`);
  for (const name of richTextPeers) {
    if (existsSync(join(consumer, 'node_modules', ...name.split('/')))) {
      problems.push(`${phase}: the optional rich-text peer ${name} was installed`);
    }
  }
  try {
    execFileSync('node', ['render.mjs'], { cwd: consumer, stdio: 'inherit' });
  } catch {
    problems.push(`${phase}: importing and rendering the components failed (see above)`);
  }
  try {
    execFileSync('node', [tsc, '-p', 'tsconfig.json'], { cwd: consumer, stdio: 'inherit' });
  } catch {
    problems.push(`${phase}: the public declarations do not type-check (see above)`);
  }
}

try {
  mkdirSync(consumer);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(consumer, name), text);

  console.log(`Installing ${dependency} with Node ${process.version}.`);
  npm(['install', dependency, ...corePeers.map(minimum), '@types/react@^19']);
  check('npm install');

  rmSync(join(consumer, 'node_modules'), { recursive: true, force: true });
  npm(['ci']);
  check('npm ci');

  try {
    npm(['install', ...richTextPeers.map(minimum)]);
    execFileSync('node', ['render-rich-text.mjs'], { cwd: consumer, stdio: 'inherit' });
  } catch {
    problems.push('rich text: installing its peers or rendering the editor failed (see above)');
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error('Git install problems:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`${dependency} installs and prepares through npm install and npm ci.`);
