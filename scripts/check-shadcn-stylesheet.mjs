#!/usr/bin/env node
// Keeps the shadcn/ui stylesheet's own parts (labs/shadcn/) to the rules that apply to them
// (UIC-LABS-3.11): each component partial is named after a reference partial and selects only hook
// classes that partial draws, so a renamed hook fails here rather than silently losing its look and
// each component's rules stay in one file; every custom property is a reference token, a shadcn/ui
// token or one of the bridge's own --ref-shadcn-* values; literal colors stay in the token defaults
// and the bridge; and no rule styles the lab page.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { option, reportProblems } from '../tooling/lib/script.mjs';
import { referenceDir, SHADCN_PARTS, shadcnDir } from './lib/labs.mjs';

/** The tokens a shadcn/ui theme defines, which the parts read and the token defaults set. */
const SHADCN_TOKENS = new Set([
  '--radius',
  ...[
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'border',
    'input',
    'ring',
    'chart-1',
    'chart-2',
    'chart-3',
    'chart-4',
    'chart-5',
    'sidebar',
    'sidebar-foreground',
    'sidebar-primary',
    'sidebar-primary-foreground',
    'sidebar-accent',
    'sidebar-accent-foreground',
    'sidebar-border',
    'sidebar-ring',
    'font-sans',
    'font-mono',
    // The tones shadcn/ui's theming guide leaves to the app.
    'success',
    'warning',
    'warning-fill',
    'warning-foreground',
    'info',
  ].map((name) => `--${name}`),
]);

const colorLiteral =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\b(?:white|black|red|green|blue|gray|grey|yellow|orange|purple|pink)\b/i;

const withoutComments = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
const lineOf = (css, index) => css.slice(0, index).split('\n').length;

/** Each selector of the style rules in `css`, outside at-rule preludes, with its offset. */
function* selectorsOf(css) {
  for (const match of css.matchAll(/(^|[{};])(\s*)([^{};@]+)\{/g)) {
    const start = match.index + match[1].length + match[2].length;
    let depth = 0;
    let from = 0;
    const prelude = match[3];
    for (let i = 0; i <= prelude.length; i += 1) {
      const char = prelude[i];
      if (char === '(') depth += 1;
      else if (char === ')') depth -= 1;
      else if (i === prelude.length || (char === ',' && depth === 0)) {
        const selector = prelude.slice(from, i);
        const lead = selector.length - selector.trimStart().length;
        if (selector.trim()) {
          yield { selector: selector.trim().replace(/\s+/g, ' '), index: start + from + lead };
        }
        from = i + 1;
      }
    }
  }
}

/** The problems of the parts in `dir`, against the reference partials in `reference`. */
function shadcnPartProblems(dir, reference) {
  const problems = [];
  const referenceParts = new Map(
    readdirSync(reference)
      .filter((file) => file.endsWith('.css'))
      .map((file) => [file, withoutComments(readFileSync(join(reference, file), 'utf8'))]),
  );
  const referenceCss = [...referenceParts.values()].join('\n');
  const hooks = new Set(referenceCss.match(/\.ui-[\w-]+/g));
  const referenceTokens = new Set(referenceCss.match(/--ref-[\w-]+/g));
  const shared = new Set(Object.values(SHADCN_PARTS).map((name) => `${name}.css`));

  const parts = readdirSync(dir)
    .filter((file) => file.endsWith('.css'))
    .sort()
    .map((file) => ({ file, css: withoutComments(readFileSync(join(dir, file), 'utf8')) }));
  const own = new Set();
  for (const { file, css } of parts) {
    for (const match of css.matchAll(/(--ref-shadcn-[\w-]+)\s*:/g)) {
      if (file !== 'bridge.css') {
        problems.push(
          `labs/shadcn/${file}:${lineOf(css, match.index)}: ${match[1]} belongs in bridge.css`,
        );
      }
      own.add(match[1]);
    }
  }
  const used = new Set();
  for (const { file, css } of parts) {
    const at = (index) => `labs/shadcn/${file}:${lineOf(css, index)}`;
    const component = !shared.has(file);
    const namesake = referenceParts.get(file);
    if (component && namesake === undefined) {
      problems.push(`labs/shadcn/${file}: no reference partial is named ${file}`);
    }
    for (const match of css.matchAll(/\.ui-[\w-]+/g)) {
      if (!hooks.has(match[0])) {
        problems.push(`${at(match.index)}: ${match[0]} is not a hook any reference partial draws`);
      }
    }
    if (component && namesake !== undefined) {
      const drawn = new Set(namesake.match(/\.ui-[\w-]+/g));
      for (const { selector, index } of selectorsOf(css)) {
        if (!(selector.match(/\.ui-[\w-]+/g) ?? []).some((hook) => drawn.has(hook))) {
          problems.push(`${at(index)}: ${selector} selects no hook reference/${file} draws`);
        }
      }
    }
    for (const match of css.matchAll(/#lab-[\w-]+|\[data-lab-[\w-]+/g)) {
      problems.push(`${at(match.index)}: ${match[0]} styles the lab page`);
    }
    for (const match of css.matchAll(/(--[\w-]+)(\s*:)?/g)) {
      const [, name, defines] = match;
      if (!defines) used.add(name);
      const allowed =
        file === 'tokens.css'
          ? SHADCN_TOKENS.has(name)
          : SHADCN_TOKENS.has(name) || referenceTokens.has(name) || own.has(name);
      if (!allowed) {
        problems.push(
          `${at(match.index)}: ${name} is neither a ${file === 'tokens.css' ? 'shadcn/ui token' : 'reference token, a shadcn/ui token nor a --ref-shadcn-* value of the bridge'}`,
        );
      }
      if (defines && component && SHADCN_TOKENS.has(name)) {
        problems.push(`${at(match.index)}: ${name} is the host's to define; set it in tokens.css`);
      }
    }
    if (component) {
      for (const match of css.matchAll(/:\s*([^;{}]+);/g)) {
        if (colorLiteral.test(match[1])) {
          problems.push(`${at(match.index)}: literal color; name it in the bridge or use a token`);
        }
      }
    }
  }
  for (const name of own) {
    if (!used.has(name)) problems.push(`labs/shadcn/bridge.css: ${name} is defined but never used`);
  }
  return problems;
}

reportProblems(shadcnPartProblems(option('dir', shadcnDir), option('reference', referenceDir)), {
  heading: 'shadcn/ui stylesheet problems',
  success: 'The shadcn/ui stylesheet parts select reference hooks and use known tokens.',
});
