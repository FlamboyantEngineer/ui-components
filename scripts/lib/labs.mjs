// Shared lab discovery and page templates for build-labs, check-labs and new-lab.

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const labsDir = join(root, 'labs');
export const labSourceDir = join(labsDir, 'src');
export const referenceDir = join(labsDir, 'reference');

/**
 * The tiers of the lab index from the simplest up, each with its groups in order: foundations,
 * then primitives grouped by type, fields built on the field base, assemblies of primitives and
 * fields for one job, and widgets that run a whole task on their own surface.
 */
export const LAB_TIERS = [
  { tier: 'Foundations', groups: ['Setup', 'Layout'] },
  {
    tier: 'Primitives',
    groups: [
      'Display',
      'Rendered content',
      'People',
      'Feedback and status',
      'Actions',
      'Inputs',
      'Navigation',
      'Overlays',
    ],
  },
  { tier: 'Fields', groups: ['Base', 'Text and numbers', 'Dates', 'Choice', 'Rich values'] },
  {
    tier: 'Assemblies',
    groups: [
      'Collections',
      'Records and properties',
      'Search and filtering',
      'Editing tools',
      'Collaboration',
      'App structure',
    ],
  },
  {
    tier: 'Widgets',
    groups: [
      'Media and pickers',
      'Charts and diagrams',
      'Planning',
      'Documents and code',
      'Conversations',
    ],
  },
];

/** The groups a tier holds, or none for an unknown tier. */
export function groupsOfTier(tier) {
  return LAB_TIERS.find((entry) => entry.tier === tier)?.groups ?? [];
}

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
    tier: meta('lab-tier'),
    group: meta('lab-group'),
    description: meta('description'),
  };
}

/**
 * Applies the stylesheet and theme from the head, before the body is parsed, and keeps the lab
 * content hidden until the stylesheet has loaded, so no page paints unstyled first. The chrome
 * stays visible, so a slow custom stylesheet can still be changed.
 */
const settingsHead = `    <style>
      html[data-lab-stylesheet-state='loading'] :is(#lab-root, #lab-index) {
        visibility: hidden;
      }
    </style>
    <script src="build/boot.js"></script>`;

export function renderLabPage({ name, title, tier, group, description }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E" />
${settingsHead}
    <meta name="lab-tier" content="${escapeHtml(tier)}" />
    <meta name="lab-group" content="${escapeHtml(group)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} · Labs</title>
    <script type="module" src="build/${name}.js"></script>
  </head>
  <body>
    <header id="lab-chrome"></header>
    <main id="lab-root"></main>
  </body>
</html>
`;
}

function renderGroup(labs, group) {
  const members = labs
    .filter((lab) => lab.group === group)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (members.length === 0) return '';
  const items = members
    .map(
      (lab) =>
        `            <li><a href="${lab.name}.html">${escapeHtml(lab.title)}</a> — ${escapeHtml(lab.description)}</li>`,
    )
    .join('\n');
  return `        <section>
          <h3>${escapeHtml(group)}</h3>
          <ul>
${items}
          </ul>
        </section>
`;
}

/** The index: each tier, simplest first, with its groups in order and their labs by title. */
export function renderIndex(labs) {
  const sections = LAB_TIERS.map(({ tier, groups }) => {
    const members = labs.filter((lab) => lab.tier === tier);
    const body = groups.map((group) => renderGroup(members, group)).join('');
    if (!body) return '';
    return `      <section>
        <h2>${escapeHtml(tier)}</h2>
${body}      </section>
`;
  }).join('');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E" />
${settingsHead}
    <meta name="description" content="Every component lab, with a shared stylesheet picker." />
    <title>Labs</title>
    <script type="module" src="build/index.js"></script>
  </head>
  <body>
    <header id="lab-chrome"></header>
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

/** Reference partials: `base` first, then one file per spec, alphabetically. */
export function listReferencePartials() {
  const names = readdirSync(referenceDir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => name.slice(0, -'.css'.length))
    .sort();
  return ['base', ...names.filter((name) => name !== 'base')];
}

export function renderReferenceIndex(partials = listReferencePartials()) {
  const imports = partials.map((name) => `@import url('reference/${name}.css');`).join('\n');
  return `/*
 * Reference stylesheet for the labs.
 *
 * Plain, neutral and readable. It styles only the hook contract (ui-* classes and data attributes)
 * plus a document base behind data-reference-document on the root element, so every component can
 * be inspected without a host stylesheet.
 * It is not part of the package API.
 *
 * Generated by \`npm run new:lab -- --sync\`: edit labs/reference/base.css or
 * labs/reference/<spec>.css, the partial named after the spec that declares the hooks.
 */

${imports}
`;
}
