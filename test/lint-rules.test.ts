// @vitest-environment node
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ cwd: process.cwd() });

async function ruleIds(code: string, filePath = 'src/components/probe/probe.tsx') {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId);
}

describe('library source lint rules', () => {
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

  it('does not apply library rules outside src', async () => {
    expect(
      await ruleIds("import './chrome.css';\nexport {};\n", 'labs/src/probe.ts'),
    ).not.toContain('ui/no-css-import');
  });
});
