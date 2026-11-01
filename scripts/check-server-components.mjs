#!/usr/bin/env node
// Checks the installed package in a server-component framework (specs/SERVER-COMPONENTS.md): packs
// the library, installs it with Next.js and React alone, so no optional peer is present, builds
// server pages for production (one importing the root entry point, one importing subpaths, one
// calling server-safe helpers through their entry points), then serves them and checks the server
// markup, server-safe utilities, hydration and tree shaking. Last, it installs the rich-text peers
// and builds a page that calls the rich-text helpers on the server.
// Needs the npm registry. `CHROMIUM_PATH` points Playwright at a browser of its own.

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { packTarball, runNpm } from './lib/npm.mjs';
import { reportProblems, root } from './lib/script.mjs';

const NEXT_VERSION = '16.4.3';
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const reactVersion = JSON.parse(
  readFileSync(join(root, 'node_modules', 'react', 'package.json'), 'utf8'),
).version;

const LAYOUT = `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
// Server pages: they render client components with serializable props and call utilities.
const ROOT_PAGE = `import { Badge, Button, Disclosure, MetaLine, UiProvider, formatMetaLine, sanitizeHtml } from '${manifest.name}';

export default function Page() {
  const nodes = sanitizeHtml('<b>Bold</b><script>alert(1)</script>');
  return (
    <UiProvider locale="en-US">
      <main>
        <p id="meta">{formatMetaLine(['Draft', 3, 'shared'])}</p>
        <p id="sanitized">{\`\${nodes.length} sanitized node\`}</p>
        <MetaLine items={['Draft', 'shared']} />
        <Badge>New</Badge>
        <Button>Save</Button>
        <Disclosure title="Opening hours">
          <p>Nine to five.</p>
        </Disclosure>
      </main>
    </UiProvider>
  );
}
`;
// A glyph from /core travels to a client component as a client reference.
const SUBPATH_PAGE = `import { Button } from '${manifest.name}/button';
import { PlusGlyph, UiProvider } from '${manifest.name}/core';
import { Disclosure } from '${manifest.name}/disclosure';
import { splitTextDiff } from '${manifest.name}/inline-text-diff';

export default function Page() {
  const diff = splitTextDiff('old text', 'new text');
  return (
    <UiProvider locale="en-US">
      <main>
        <p id="diff">{\`Added \${diff.added}\`}</p>
        <Button>Save</Button>
        <Button startIcon={PlusGlyph}>Add row</Button>
        <Disclosure title="Opening hours">
          <p>Nine to five.</p>
        </Disclosure>
      </main>
    </UiProvider>
  );
}
`;

// Date fields on a 12-hour clock, whose Intl spacing literals differ between Node and browsers
// (U+202F against U+0020), beside a 24-hour control; all in one explicit zone (UIC-DATE-TIME-FIELD-1.1).
const DATES_PAGE = `import { Button, DateTimeField, Disclosure, UiProvider } from '${manifest.name}';

export default function Page() {
  const zone = 'America/New_York';
  return (
    <UiProvider locale="en-US">
      <main>
        <DateTimeField label="Alarm" mode="time" defaultValue="18:30" />
        <DateTimeField label="Start" mode="date-time" timeZone={zone} defaultValue="2026-11-01T06:30:00Z" />
        <DateTimeField
          label="Window"
          mode="date-time-range"
          timeZone={zone}
          defaultValue={{ start: '2026-11-01T06:30:00Z', end: '2026-11-01T18:00:00Z' }}
        />
        <DateTimeField
          label="Shift"
          mode="date-time"
          hourCycle={24}
          timeZone={zone}
          defaultValue="2026-11-01T06:30:00Z"
        />
        <Button>Save</Button>
        <Disclosure title="Opening hours">
          <p>Nine to five.</p>
        </Disclosure>
      </main>
    </UiProvider>
  );
}
`;

// Server-safe helpers called through their public entry points, which must not hand the server a
// client reference (UIC-SERVER-COMPONENTS-1.4).
const HELPERS_PAGE = `import { resolveAvatarColor } from '${manifest.name}/avatar';
import { cycleCheckState } from '${manifest.name}/checkbox';
import { createConditionMatcher } from '${manifest.name}/condition-builder';
import { createFilterMatcher } from '${manifest.name}/filter-bar';
import { reduceChatStream } from '${manifest.name}/chat-controller';
import { findBoxAtPoint } from '${manifest.name}/pdf-viewer';
import { keepThumbsApart } from '${manifest.name}/slider';
import { findNextZoomLevel } from '${manifest.name}/zoom-control';

export default function Page() {
  const reply = reduceChatStream(
    { id: 'reply', createdAt: '2026-01-01T00:00:00Z', parts: [] },
    { type: 'text-delta', text: 'Streamed' },
  );
  const fields = [{ id: 'title', label: 'Title', type: 'text' }];
  const getValue = (record) => record.title;
  const tree = {
    type: 'group',
    id: 'root',
    combinator: 'or',
    rules: [
      { type: 'rule', id: 'a', field: 'title', operator: 'contains', value: 'salt' },
      {
        type: 'group',
        id: 'b',
        combinator: 'and',
        rules: [{ type: 'rule', id: 'c', field: 'title', operator: 'equals', value: 'atom' }],
      },
    ],
  };
  const titles = ['Salt road', 'Atom', 'Orchard'];
  const inTree = createConditionMatcher({ group: tree, fields, getValue });
  const flat = createFilterMatcher({ conditions: [{ field: 'title', operator: 'contains', value: 'o' }], fields, getValue });
  const box = findBoxAtPoint([{ left: 0, top: 0, width: 10, height: 10, name: 'box' }], { left: 5, top: 5 });
  const values = [
    reply.parts.map((part) => part.text).join(''),
    titles.filter((title) => inTree({ title })).join('+'),
    titles.filter((title) => flat({ title })).join('+'),
    box?.name,
    resolveAvatarColor({ name: 'x', colorIndex: 9 }, 4),
    String(cycleCheckState(null)),
    findNextZoomLevel([50, 100, 200], 100, 1),
    keepThumbsApart([40, 45], [40, 60], { distance: 10, minValue: 0, maxValue: 100 }).join('-'),
  ];
  return <p id="helpers">{values.join(' ')}</p>;
}
`;
const RICH_TEXT_PAGE = `import { serializeRichTextHtml, serializeRichTextText } from '${manifest.name}/rich-text-editor';

const doc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
};

export default function Page() {
  return (
    <main>
      <pre id="html">{serializeRichTextHtml(doc)}</pre>
      <p id="text">{\`Plain \${serializeRichTextText(doc)}\`}</p>
    </main>
  );
}
`;
const RICH_TEXT_PEERS = Object.keys(manifest.peerDependencies).filter(
  (name) =>
    name === '@handlewithcare/react-prosemirror' ||
    name === 'react-reconciler' ||
    name.startsWith('prosemirror-'),
);
const installedVersion = (name) =>
  JSON.parse(readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;

const problems = [];
const workDir = mkdtempSync(join(tmpdir(), 'ui-server-components-'));
const appDir = join(workDir, 'app');
const install = (packages) =>
  runNpm(['install', '--no-audit', '--no-fund', ...packages], {
    cwd: appDir,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
const nextBuild = () =>
  runNpm(['exec', '--', 'next', 'build'], { cwd: appDir, env, stdio: 'inherit' });

function write(path, text) {
  mkdirSync(resolve(appDir, path, '..'), { recursive: true });
  writeFileSync(join(appDir, path), text);
}

/** A port nothing listens on. */
function freePort() {
  return new Promise((done) => {
    const probe = createServer().listen(0, () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (probe.address());
      probe.close(() => done(port));
    });
  });
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`${url} did not answer`);
}

/** Checks one served page: its server markup, then hydration in a browser. */
async function checkPage(browser, origin, path, expected) {
  const url = `${origin}${path}`;
  const html = await (await fetch(url)).text();
  for (const text of [...expected, 'class="ui-button', 'class="ui-disclosure']) {
    if (!html.includes(text)) problems.push(`${path}: the server markup lacks ${text}`);
  }
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // The pages have no icon; any other error, such as a hydration mismatch, fails the check.
    const isIcon = message.location().url.endsWith('/favicon.ico');
    if (message.type() === 'error' && !isIcon) errors.push(message.text());
  });
  await page.goto(url);
  const trigger = page.getByRole('button', { name: 'Opening hours' });
  await trigger.click();
  try {
    await page.getByText('Nine to five.').waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    problems.push(`${path}: the disclosure did not open, so the page did not hydrate`);
  }
  for (const error of errors) problems.push(`${path}: the browser reported ${error}`);
  await page.close();
}

/** Checks a served page's server markup only, for a page without interactive parts. */
async function checkMarkup(origin, path, expected) {
  const html = await (await fetch(`${origin}${path}`)).text();
  for (const text of expected) {
    if (!html.includes(text)) problems.push(`${path}: the server markup lacks ${text}`);
  }
}

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
let server;
let browser;

/** Serves the built app on a free port and returns its origin. */
async function serve() {
  const port = await freePort();
  const origin = `http://localhost:${port}`;
  // Next's own command, run by Node rather than through npm, so stopping it stops the server.
  const next = join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  server = spawn(process.execPath, [next, 'start', '-p', String(port)], { cwd: appDir, env });
  await waitForServer(`${origin}/`);
  return origin;
}

function stopServer() {
  server?.kill();
  server = undefined;
}

try {
  // Built once here and packed as built, so packing runs no package script.
  runNpm(['run', 'build:package'], { cwd: root, stdio: 'inherit' });
  const pack = packTarball(root, workDir);
  write('package.json', JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  write('app/layout.js', LAYOUT);
  write('app/page.js', ROOT_PAGE);
  write('app/subpaths/page.js', SUBPATH_PAGE);
  write('app/helpers/page.js', HELPERS_PAGE);
  write('app/dates/page.js', DATES_PAGE);
  install([
    `next@${NEXT_VERSION}`,
    `react@${reactVersion}`,
    `react-dom@${reactVersion}`,
    join(workDir, pack.filename),
  ]);
  nextBuild();

  // Tree shaking: the client code holds the components the pages render and no others.
  const chunks = join(appDir, '.next', 'static', 'chunks');
  const client = readdirSync(chunks, { recursive: true })
    .filter((name) => String(name).endsWith('.js'))
    .map((name) => readFileSync(join(chunks, String(name)), 'utf8'))
    .join('\n');
  for (const name of ['chat-transcript', 'code-editor', 'board', 'rich-text-editor']) {
    if (client.includes(`"${name}"`)) problems.push(`the client code includes the unused ${name}`);
  }

  const origin = await serve();
  const executablePath = process.env.CHROMIUM_PATH;
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  await checkPage(browser, origin, '/', [
    'Draft · 3 · shared',
    '1 sanitized node',
    'class="ui-badge',
  ]);
  await checkPage(browser, origin, '/subpaths', ['Added new', 'Add row', 'class="ui-glyph']);
  await checkPage(browser, origin, '/dates', ['class="ui-date-time-field']);
  await checkMarkup(origin, '/helpers', [
    'Streamed Salt road+Atom Salt road+Atom+Orchard box 1 true 200 40-50',
  ]);
  stopServer();

  // The rich-text helpers, with the optional peers they need.
  install(RICH_TEXT_PEERS.map((name) => `${name}@${installedVersion(name)}`));
  write('app/rich-text/page.js', RICH_TEXT_PAGE);
  nextBuild();
  await checkMarkup(await serve(), '/rich-text', ['&lt;p&gt;Hello&lt;/p&gt;', 'Plain Hello']);
} catch (error) {
  problems.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser?.close();
  stopServer();
  rmSync(workDir, { recursive: true, force: true });
}

reportProblems(problems, {
  heading: 'Server components problems',
  success: `Next.js ${NEXT_VERSION} builds, serves and hydrates the installed package.`,
});
