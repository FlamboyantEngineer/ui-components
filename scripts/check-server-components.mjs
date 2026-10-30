#!/usr/bin/env node
// Checks the installed package in a server-component framework (specs/SERVER-COMPONENTS.md): packs
// the library, installs it with Next.js and React alone, so no optional peer is present, builds two
// server pages for production (one importing the root entry point, one importing subpaths), then
// serves them and checks the server markup, server-safe utilities, hydration and tree shaking.
// Needs the npm registry. `CHROMIUM_PATH` points Playwright at a browser of its own.

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
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
const SUBPATH_PAGE = `import { Button } from '${manifest.name}/button';
import { UiProvider } from '${manifest.name}/core';
import { Disclosure } from '${manifest.name}/disclosure';
import { splitTextDiff } from '${manifest.name}/inline-text-diff';

export default function Page() {
  const diff = splitTextDiff('old text', 'new text');
  return (
    <UiProvider locale="en-US">
      <main>
        <p id="diff">{\`Added \${diff.added}\`}</p>
        <Button>Save</Button>
        <Disclosure title="Opening hours">
          <p>Nine to five.</p>
        </Disclosure>
      </main>
    </UiProvider>
  );
}
`;

const problems = [];
const workDir = mkdtempSync(join(tmpdir(), 'ui-server-components-'));
const appDir = join(workDir, 'app');
const run = (command, args) =>
  execFileSync(command, args, { cwd: appDir, stdio: ['ignore', 'pipe', 'inherit'] });

function write(path, text) {
  mkdirSync(resolve(appDir, path, '..'), { recursive: true });
  writeFileSync(join(appDir, path), text);
}

/** A port nothing listens on. */
function freePort() {
  return new Promise((done) => {
    const probe = createServer().listen(0, () => {
      const { port } = probe.address();
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

let server;
let browser;
try {
  const output = execFileSync(
    'npm',
    ['pack', '--json', '--foreground-scripts=false', '--pack-destination', workDir],
    { cwd: root, encoding: 'utf8' },
  );
  const [pack] = JSON.parse(output);
  write('package.json', JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  write('app/layout.js', LAYOUT);
  write('app/page.js', ROOT_PAGE);
  write('app/subpaths/page.js', SUBPATH_PAGE);
  run('npm', [
    'install',
    '--no-audit',
    '--no-fund',
    `next@${NEXT_VERSION}`,
    `react@${reactVersion}`,
    `react-dom@${reactVersion}`,
    join(workDir, pack.filename),
  ]);
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
  execFileSync('npx', ['next', 'build'], { cwd: appDir, env, stdio: 'inherit' });

  // Tree shaking: the client code holds the components the pages render and no others.
  const chunks = join(appDir, '.next', 'static', 'chunks');
  const client = readdirSync(chunks, { recursive: true })
    .filter((name) => String(name).endsWith('.js'))
    .map((name) => readFileSync(join(chunks, String(name)), 'utf8'))
    .join('\n');
  for (const name of ['chat-transcript', 'code-editor', 'board', 'rich-text-editor']) {
    if (client.includes(`"${name}"`)) problems.push(`the client code includes the unused ${name}`);
  }

  // Its own process group, so stopping it stops the server process Next starts.
  const port = await freePort();
  const origin = `http://localhost:${port}`;
  server = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: appDir,
    env,
    detached: true,
  });
  await waitForServer(`${origin}/`);
  const executablePath = process.env.CHROMIUM_PATH;
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  await checkPage(browser, origin, '/', [
    'Draft · 3 · shared',
    '1 sanitized node',
    'class="ui-badge',
  ]);
  await checkPage(browser, origin, '/subpaths', ['Added new']);
} catch (error) {
  problems.push(error instanceof Error ? error.message : String(error));
} finally {
  await browser?.close();
  if (server?.pid) process.kill(-server.pid);
  rmSync(workDir, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Next.js ${NEXT_VERSION} builds, serves and hydrates the installed package.`);
