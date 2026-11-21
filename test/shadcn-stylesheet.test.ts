// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-shadcn-stylesheet.mjs');
const dirs: string[] = [];

const load = async <T>(path: string) =>
  (await import(pathToFileURL(join(process.cwd(), path)).href)) as T;

function check(parts: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-shadcn-'));
  dirs.push(dir);
  const reference = join(dir, 'reference');
  const shadcn = join(dir, 'shadcn');
  mkdirSync(reference);
  mkdirSync(shadcn);
  writeFileSync(
    join(reference, 'base.css'),
    ':root { --ref-text: #000; --ref-radius: 6px; }\n.ui-button { color: var(--ref-text); }\n',
  );
  writeFileSync(join(reference, 'card.css'), '.ui-card { border-radius: var(--ref-radius); }\n');
  for (const [name, css] of Object.entries(parts)) writeFileSync(join(shadcn, name), css);
  return spawnSync(process.execPath, [script, '--dir', shadcn, '--reference', reference], {
    encoding: 'utf8',
  });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('shadcn/ui stylesheet parts', () => {
  it('UIC-LABS-3.11 passes the repository parts', () => {
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('UIC-LABS-3.11 accepts reference hooks, reference and shadcn/ui tokens and bridge values', () => {
    const result = check({
      'tokens.css': ':root { --primary: oklch(0.2 0 0); }\n',
      'bridge.css': ':root { --ref-text: var(--foreground); --ref-shadcn-ring: 0 0 0 1px red; }\n',
      'base.css': '.ui-button { color: var(--primary); box-shadow: var(--ref-shadcn-ring); }\n',
      'card.css': '.ui-card .ui-button, .ui-card:where(.dark *) { color: var(--card); }\n',
    });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('UIC-LABS-3.11 rejects a renamed hook, an unknown token, a stray literal and lab rules', () => {
    const result = check({
      'tokens.css': ':root { --brand: #123456; }\n',
      'bridge.css': ':root { --ref-shadcn-unused: 1px; }\n',
      'base.css': [
        '.ui-buton { color: var(--ref-txt); }',
        '.ui-button { background: #fff; --primary: black; }',
        '#lab-root .ui-button { --ref-shadcn-own: 0; }',
      ].join('\n'),
    });
    expect(result.status).toBe(1);
    for (const problem of [
      'tokens.css:1: --brand is neither a shadcn/ui token',
      'base.css:1: .ui-buton is not a hook any reference partial draws',
      'base.css:1: --ref-txt is neither a reference token',
      'base.css:2: literal color',
      'base.css:2: --primary is the host',
      'base.css:3: #lab-root styles the lab page',
      'base.css:3: --ref-shadcn-own belongs in bridge.css',
      'bridge.css: --ref-shadcn-unused is defined but never used',
    ]) {
      expect(result.stderr).toContain(problem);
    }
  });

  it('UIC-LABS-3.11 keeps each component partial to the reference partial it is named after', () => {
    const result = check({
      'card.css':
        '.ui-card, .ui-card .ui-button {}\n.ui-button,\n  .ui-button:where(.ui-card) {}\n',
      'cards.css': '.ui-card {}\n',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'card.css:2: .ui-button selects no hook reference/card.css draws',
    );
    expect(result.stderr).not.toContain('card.css:1:');
    expect(result.stderr).not.toContain(':where(.ui-card)');
    expect(result.stderr).toContain('cards.css: no reference partial is named cards.css');
  });

  it('UIC-LABS-3.11 orders the token defaults, the reference partials and the overrides', async () => {
    const { renderShadcnIndex: shadcnIndex } = await load<{ renderShadcnIndex: () => string }>(
      'scripts/lib/labs.mjs',
    );
    const index = shadcnIndex();
    expect(readFileSync(join(process.cwd(), 'labs', 'shadcn.css'), 'utf8')).toBe(index);
    const imports = [...index.matchAll(/@import url\('([^']+)'\) layer\(([\w-]+)\);/g)].map(
      ([, file, layer]) => `${layer} ${file}`,
    );
    expect(index).toContain('@layer ui-shadcn-tokens, ui-reference, ui-shadcn;');
    expect(imports[0]).toBe('ui-shadcn-tokens shadcn/tokens.css');
    expect(imports[1]).toBe('ui-reference reference/base.css');
    const overrides = imports.filter((entry) => entry.startsWith('ui-shadcn '));
    expect(imports.slice(-overrides.length)).toEqual(overrides);
    expect(overrides[0]).toBe('ui-shadcn shadcn/bridge.css');
    const components = overrides.slice(1).map((entry) => entry.slice('ui-shadcn shadcn/'.length));
    const referenceOrder = imports
      .filter((entry) => entry.startsWith('ui-reference '))
      .map((entry) => entry.slice('ui-reference reference/'.length));
    expect(components).toEqual(referenceOrder.filter((name) => components.includes(name)));
    expect(components).toContain('button.css');
    for (const name of components) {
      expect(imports).toContain(`ui-reference reference/${name}`);
    }
    expect(imports.filter((entry) => entry.startsWith('ui-reference ')).length).toBeGreaterThan(
      100,
    );
  });
});

describe('shipped shadcn/ui stylesheet', () => {
  const required = [
    '@layer ui-shadcn-tokens,ui-reference,ui-shadcn;',
    '@layer ui-shadcn-tokens{:root{--primary:black}}',
    '@layer ui-reference{.ui-field[data-density=compact]{} .ui-card[data-density=compact]{} .ui-button{}}',
    '@layer ui-shadcn{:root{--ref-accent: var(--primary)} .ui-tabs__list:not([data-orientation=vertical]){}}',
  ].join('');

  it('UIC-LABS-1.11 rejects rules outside its layers, a lost layer order and lab rules', async () => {
    const { shadcnStylesheetProblems } = await load<{
      shadcnStylesheetProblems: (css: string) => string[];
    }>('scripts/lib/reference-stylesheet.mjs');
    expect(shadcnStylesheetProblems(required)).toEqual([]);
    expect(shadcnStylesheetProblems(`${required}.ui-button{color:red}`)).toEqual([
      'labs/build/shadcn.css has a rule outside its layers (.ui-button)',
    ]);
    expect(shadcnStylesheetProblems(required.replace(/^@layer[^;]*;/, ''))).toEqual([
      'labs/build/shadcn.css does not open by ordering its layers ui-shadcn-tokens, ui-reference, ui-shadcn',
    ]);
    expect(
      shadcnStylesheetProblems(
        `${required}@layer ui-shadcn{#lab-root{} .x{background:url(a.png)}}`,
      ),
    ).toEqual([
      'labs/build/shadcn.css styles the lab page (#lab-root)',
      'labs/build/shadcn.css loads a.png',
    ]);
  });
});
