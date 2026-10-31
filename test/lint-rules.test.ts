// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

// Probe files are not on disk, so the type-aware rules, which need the TypeScript program, are off.
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfig: tseslint.configs.disableTypeChecked,
});

async function ruleIds(code: string, filePath = 'src/components/probe/probe.tsx') {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId);
}

// Loading the ESLint config and TypeScript parser is slow on a busy machine.
describe('library source lint rules', { timeout: 30_000 }, () => {
  it('UIC-HOOKS-3.1 rejects stylesheet imports', async () => {
    expect(await ruleIds("import './probe.css';\nexport {};\n")).toContain('ui/no-css-import');
    expect(await ruleIds("export * from './theme.scss';\n")).toContain('ui/no-css-import');
  });

  it('UIC-HOOKS-3.2 rejects static visual inline styles', async () => {
    const code = `export function Probe() {\n  return <div style={{ color: 'red', padding: 4 }} />;\n}\n`;
    const ids = await ruleIds(code);
    expect(ids.filter((id) => id === 'ui/no-static-inline-style')).toHaveLength(2);
  });

  it('UIC-HOOKS-3.2 rejects visual styles set imperatively', async () => {
    const code = `export function paint(node: HTMLElement) {\n  node.style.background = 'red';\n  node.style.setProperty('margin', '0');\n}\n`;
    const ids = await ruleIds(code, 'src/components/probe/paint.ts');
    expect(ids.filter((id) => id === 'ui/no-static-inline-style')).toHaveLength(2);
  });

  it('UIC-HOOKS-3.2 allows functional inline styles and documented custom properties', async () => {
    const code = `export function Probe({ top, width }: { top: number; width: number }) {\n  return <div className="ui-probe" style={{ position: 'absolute', top, width, '--ui-probe-width': \`\${width}px\` } as React.CSSProperties} />;\n}\n`;
    expect(await ruleIds(code)).not.toContain('ui/no-static-inline-style');
  });

  it('UIC-HOOKS-3.2 rejects class names that are not hooks', async () => {
    const code = `export function Probe() {\n  return <div className="flex gap-2" />;\n}\n`;
    expect(await ruleIds(code)).toContain('ui/hook-class-names');
  });

  it('UIC-HOOKS-3.1 UIC-PROVIDER-6.1 rejects styling packages and direct browser storage', async () => {
    const ids = await ruleIds(
      "import styled from 'styled-components';\nexport const value = localStorage.getItem('k');\nexport { styled };\n",
    );
    expect(ids).toContain('no-restricted-imports');
    expect(ids).toContain('no-restricted-globals');
  });

  it('rejects <Context.Provider> in source, tests and labs (I5)', async () => {
    const code = `import { createContext } from 'react';\nconst Probe = createContext(0);\nexport function Host() {\n  return <Probe.Provider value={1} />;\n}\nexport const Raw = Probe.Provider;\n`;
    for (const path of [
      'src/components/probe/probe.tsx',
      'src/components/probe/probe.test.tsx',
      'labs/src/probe.lab.tsx',
    ]) {
      const ids = await ruleIds(code, path);
      expect(
        ids.filter((id) => id === 'no-restricted-syntax'),
        path,
      ).toHaveLength(2);
    }
    const allowed = code
      .replace('<Probe.Provider value={1} />', '<Probe value={1} />')
      .replace('export const Raw = Probe.Provider;\n', '');
    expect(await ruleIds(allowed)).not.toContain('no-restricted-syntax');
  });

  it('does not apply library markup rules to tests', async () => {
    const code = `export function Probe() {\n  return <div className="caller" style={{ color: 'red' }} />;\n}\n`;
    const ids = await ruleIds(code, 'src/components/probe/probe.test.tsx');
    expect(ids).not.toContain('ui/hook-class-names');
    expect(ids).not.toContain('ui/no-static-inline-style');
  });

  it('UIC-PRIMITIVES-1.4 makes labs import a component through its entry point or main module', async () => {
    const lab = 'labs/src/probe.lab.tsx';
    const imports = (path: string) =>
      `import { Probe } from '../../src/components/${path}';\nexport { Probe };\n`;
    expect(await ruleIds(imports('table/table-rows.js'), lab)).toContain('ui/component-imports');
    expect(await ruleIds(imports('table/index.js'), lab)).not.toContain('ui/component-imports');
    expect(await ruleIds(imports('table/table.js'), lab)).not.toContain('ui/component-imports');
  });

  it('UIC-PRIMITIVES-1.4 makes labs import shared utils and core only as their index re-exports them', async () => {
    const lab = 'labs/src/probe.lab.tsx';
    const imports = (names: string, path: string) =>
      `import { ${names} } from '../../src/${path}';\nexport { ${names} };\n`;
    const internal = imports('requireDefined', 'utils/require-defined.js');
    expect(await ruleIds(internal, lab)).toContain('ui/component-imports');
    const unlisted = imports('formatStableTime', 'utils/relative-time.js');
    expect(await ruleIds(unlisted, lab)).toContain('ui/component-imports');
    const namespace = "import * as glyphs from '../../src/core/glyphs.js';\nexport { glyphs };\n";
    expect(await ruleIds(namespace, lab)).toContain('ui/component-imports');
    for (const allowed of [
      imports('formatCount', 'utils/count.js'),
      imports('formatCount', 'utils/index.js'),
      imports('UiProvider', 'core/provider.js'),
      "import * as languages from '../../src/core/locales/index.js';\nexport { languages };\n",
    ]) {
      expect(await ruleIds(allowed, lab), allowed).not.toContain('ui/component-imports');
    }
    expect(await ruleIds(internal, 'e2e/probe.spec.ts')).not.toContain('ui/component-imports');
  });

  it('UIC-LABS-3.4 keeps component specs from reloading a lab dark for the scan the sweep runs', async () => {
    const spec = (body: string) =>
      `import { test } from './fixtures.js';\ntest('probe', async ({ lab }) => {\n${body}\n});\n`;
    const reload =
      "  await lab.open('probe');\n  await lab.expectAccessible();\n  await lab.open('probe', { theme: 'dark' });\n  await lab.expectAccessible();";
    expect(await ruleIds(spec(reload), 'e2e/probe.spec.ts')).toContain('no-restricted-syntax');
    const scoped =
      "  await lab.open('probe', { theme: 'dark' });\n  await lab.expectAccessible('.ui-probe');";
    expect(await ruleIds(spec(scoped), 'e2e/probe.spec.ts')).not.toContain('no-restricted-syntax');
    expect(await ruleIds(spec(reload), 'e2e/accessibility.spec.ts')).not.toContain(
      'no-restricted-syntax',
    );
  });

  it('UIC-LABS-3.2 UIC-LABS-3.7 keeps lab addresses and control heights in the e2e fixture', async () => {
    const spec = (body: string) =>
      `import { expect, test } from './fixtures.js';\ntest('probe', async ({ page }) => {\n${body}\n});\n`;
    const restricted = async (body: string, filePath = 'e2e/probe.spec.ts') =>
      (await ruleIds(spec(body), filePath)).filter((id) => id === 'no-restricted-syntax').length;
    expect(await restricted(`  page.locator('[data-lab-cell="size=md"]');`)).toBe(1);
    expect(await restricted('  page.locator(`[data-lab-family="${String(1)}"] .ui-probe`);')).toBe(
      1,
    );
    expect(
      await restricted("  await expect(page.locator('.ui-probe')).toHaveCSS('height', '28px');"),
    ).toBe(1);
    expect(
      await restricted(
        "  await expect(page.locator('.ui-probe')).toHaveCSS('height', '28px');",
        'e2e/control-sizes.spec.ts',
      ),
    ).toBe(0);
    expect(await restricted("  page.locator('[data-lab-cell]');")).toBe(0);
  });

  it('does not apply library rules outside src', async () => {
    expect(
      await ruleIds("import './chrome.css';\nexport {};\n", 'labs/src/probe.ts'),
    ).not.toContain('ui/no-css-import');
  });

  it('re-enables every block-level fireEvent allowance it opens (T9)', () => {
    const files = ['src', 'test', 'e2e', 'labs/src']
      .flatMap((dir) =>
        readdirSync(dir, { recursive: true }).map((name) => join(dir, String(name))),
      )
      .filter((path) => /\.tsx?$/.test(path));
    const open = files.filter((path) => {
      const text = readFileSync(path, 'utf8');
      const count = (word: string) =>
        text.split(`/* eslint-${word} testing-library/prefer-user-event */`).length - 1;
      return count('disable') !== count('enable');
    });
    expect(open).toEqual([]);
  });
});
