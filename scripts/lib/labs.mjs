// Shared lab discovery and page templates for build-labs, check-labs and new-lab.

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const labsDir = join(root, 'labs');
export const labSourceDir = join(labsDir, 'src');

export const LAB_GROUPS = [
  'Harness',
  'Foundations',
  'Actions and navigation',
  'Feedback and status',
  'Overlays and menus',
  'Field base',
  'Field controls',
  'Data views',
  'Widgets',
];

export function listLabSources() {
  return readdirSync(labSourceDir)
    .filter((name) => name.endsWith('.lab.tsx'))
    .map((name) => name.slice(0, -'.lab.tsx'.length))
    .sort();
}

export function listLabPages() {
  return readdirSync(labsDir)
    .filter((name) => name.endsWith('.html') && name !== 'index.html')
    .map((name) => name.slice(0, -'.html'.length))
    .sort();
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function unescapeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}

export function readLabMeta(name) {
  const html = readFileSync(join(labsDir, `${name}.html`), 'utf8');
  const meta = (key) => {
    const match = html.match(new RegExp(`<meta name="${key}" content="([^"]*)"`));
    return match ? unescapeHtml(match[1]) : null;
  };
  const title = html.match(/<title>([^<]*) · Labs<\/title>/);
  return {
    name,
    html,
    title: title ? unescapeHtml(title[1]) : null,
    group: meta('lab-group'),
    description: meta('description'),
  };
}

export function renderLabPage({ name, title, group, description }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="lab-group" content="${escapeHtml(group)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} · Labs</title>
    <script type="module" src="build/${name}.js"></script>
  </head>
  <body>
    <div id="lab-chrome"></div>
    <main id="lab-root"></main>
  </body>
</html>
`;
}

export function renderIndex(labs) {
  const sections = LAB_GROUPS.map((group) => {
    const members = labs
      .filter((lab) => lab.group === group)
      .sort((a, b) => a.title.localeCompare(b.title));
    if (members.length === 0) return '';
    const items = members
      .map(
        (lab) =>
          `          <li><a href="${lab.name}.html">${escapeHtml(lab.title)}</a> — ${escapeHtml(lab.description)}</li>`,
      )
      .join('\n');
    return `      <section>
        <h2>${escapeHtml(group)}</h2>
        <ul>
${items}
        </ul>
      </section>
`;
  }).join('');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Every component lab, with a shared stylesheet picker." />
    <title>Labs</title>
    <script type="module" src="build/index.js"></script>
  </head>
  <body>
    <div id="lab-chrome"></div>
    <main id="lab-index">
      <h1>Labs</h1>
${sections}    </main>
  </body>
</html>
`;
}

export function collectLabs() {
  return listLabPages().map(readLabMeta);
}
