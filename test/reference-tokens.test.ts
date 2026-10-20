// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(process.cwd(), 'scripts', 'check-reference-tokens.mjs');
const dirs: string[] = [];

const base = `:root {
  --ref-text: #1f2328;
  --ref-canvas: #ffffff;
  --ref-accent: #0969da;
  --ref-radius: 6px;
  --ref-font-size-sm: 12px;
}
:root[data-theme='dark'] {
  --ref-text: #f0f6fc;
  --ref-canvas: #0d1117;
}
`;

function check(partials: Record<string, string>, baseCss = base) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-tokens-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'base.css'), baseCss);
  for (const [name, css] of Object.entries(partials)) writeFileSync(join(dir, name), css);
  return spawnSync(process.execPath, [script, '--dir', dir], { encoding: 'utf8' });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('reference token check', () => {
  it('UIC-LABS-3.5 passes the repository reference stylesheet', () => {
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('UIC-LABS-3.5 accepts partials that use the tokens', () => {
    const result = check({
      'card.css': `.ui-card { color: var(--ref-text); background: var(--ref-canvas); border-radius: var(--ref-radius); font-size: var(--ref-font-size-sm); border-color: var(--ref-accent); }`,
    });
    expect(result.status).toBe(0);
  });

  it('UIC-LABS-3.5 rejects literals a token covers, unless marked exempt', () => {
    const result = check({
      'card.css': `.ui-card { color: #333; border-radius: 5px; font-size: 13px; transition: opacity 0.3s; }
.ui-card[data-disabled] { opacity: 0.4; }
.ui-card__paper { background: #ffffff; /* token-exempt: paper */ }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('literal colour in color');
    expect(result.stderr).toContain('border-radius "5px" is not a radius token');
    expect(result.stderr).toContain('font-size "13px" is not a type token');
    expect(result.stderr).toContain('literal duration in transition');
    expect(result.stderr).toContain('use --ref-disabled-opacity');
    expect(result.stderr).not.toContain('card.css:3');
  });

  it('UIC-LABS-3.5 marks a dirty field with a uniform frame, not a bar', () => {
    const result = check({
      'card.css': `.ui-card[data-dirty] .ui-card__frame { border-inline-start: 3px solid var(--ref-accent); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('a dirty field marks its whole frame');
  });

  it('UIC-LABS-3.5 rejects unused, undefined, misnamed and duplicated tokens', () => {
    const result = check(
      {
        'card.css': `.ui-card { --ref-gap: 4px; gap: var(--ref-gap); color: var(--ref-missing); }`,
      },
      base.replace('  --ref-radius: 6px;\n', '  --ref-radius: 6px;\n  --ref-ink: #0969da;\n'),
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--ref-missing is used but never defined');
    expect(result.stderr).toContain('--ref-ink is defined but never used');
    expect(result.stderr).toContain('--ref-gap is scoped to card.css, so it is named --ref-card-');
    expect(result.stderr).toMatch(/--ref-(ink|accent) repeats the value of --ref-(accent|ink)/);
  });
});
