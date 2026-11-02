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

  it('UIC-LABS-3.5 rejects a z-index above the in-page scale', () => {
    const result = check({
      'card.css': `.ui-card__header { z-index: 4; }
.ui-card__shield { z-index: 1000; }
.ui-card__stack { z-index: calc(10 - var(--ui-toast-index)); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('card.css:2: z-index 1000 is above the in-page scale');
    expect(result.stderr).not.toContain('card.css:1:');
    expect(result.stderr).not.toContain('card.css:3:');
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

  it('UIC-LABS-3.5 checks size, weight and family in font shorthands while preserving line height', () => {
    const type = `${base}:root { --ref-font: system-ui; --ref-mono: monospace; }`;
    const common = `.ui-card { color: var(--ref-text); background: var(--ref-canvas); border-radius: var(--ref-radius); border-color: var(--ref-accent); font-size: var(--ref-font-size-sm); font-family: var(--ref-font); }`;
    const result = check(
      {
        'card.css': `${common}
.ui-card__label { font: 13px/20px var(--ref-font); }
.ui-card__title { font: 600 var(--ref-font-size-sm)/1.3 var(--ref-font); }
.ui-card__other { font: var(--ref-font-size-sm)/1.3 Arial; }`,
      },
      type,
    );
    expect(result.status).toBe(1);
    expect(result.stderr.match(/is not a type token shorthand/g)).toHaveLength(3);
    const valid = check(
      {
        'card.css': `${common}
.ui-card__code { font: var(--ref-font-size-sm)/20px var(--ref-mono); }
.ui-card__label { font: inherit; }`,
      },
      type,
    );
    expect(valid.stderr).toBe('');
    expect(valid.status).toBe(0);
  });

  it('UIC-LABS-3.5 UIC-LABS-3.7 keeps line heights, inputs and option rows off fixed pixels', () => {
    const type = `${base}:root { --ref-font: system-ui; --ref-mono: monospace; --ref-control-height-md: 1.75rem; }`;
    const common = `.ui-card { color: var(--ref-text); background: var(--ref-canvas); border-radius: var(--ref-radius); border-color: var(--ref-accent); font-size: var(--ref-font-size-sm); font-family: var(--ref-font); }`;
    const result = check(
      {
        'card.css': `${common}
.ui-card__title { line-height: 20px; }
.ui-card__label { font: var(--ref-font-size-sm)/20px var(--ref-font); }
.ui-card__search-input { height: 28px; }
.ui-card__option { min-height: 28px; }
.ui-card__input { min-height: 22px; }`,
      },
      type,
    );
    expect(result.status).toBe(1);
    expect(result.stderr.match(/in px outside a code view/g)).toHaveLength(2);
    expect(result.stderr.match(/sizes an input or option row in px/g)).toHaveLength(3);
    expect(result.stderr).toContain('min-height "22px" sizes an input');
    const valid = check(
      {
        'card.css': `${common}
.ui-card__title { line-height: 1.25rem; }
.ui-card__code { line-height: 20px; font-family: var(--ref-mono); }
.ui-card__search-input { height: var(--ref-control-height-md); }
.ui-card__option { min-height: 1.75rem; }
.ui-card__input { height: calc(var(--ref-control-height-md) - 2px); }
.ui-card[data-multiline] .ui-card__input { min-height: 64px; }`,
      },
      type,
    );
    expect(valid.stderr).toBe('');
    expect(valid.status).toBe(0);
  });

  it('UIC-LABS-3.6 UIC-LABS-3.7 checks every grouped selector without splitting functional or quoted commas', () => {
    const common = `.ui-card { color: var(--ref-text); background: var(--ref-canvas); border-radius: var(--ref-radius); border-color: var(--ref-accent); font-size: var(--ref-font-size-sm); }`;
    const result = check(
      {
        'card.css': `${common}
.ui-card[data-selected],
.ui-card__label { padding: 8px; }
.ui-card[data-size='sm'],
.ui-card[data-size='xs'] { height: var(--ref-control-height-sm); }`,
      },
      `${base}:root { --ref-control-height-sm: 24px; }`,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('card.css:3: padding changes with a state');
    expect(result.stderr).toContain('a xs control takes --ref-control-height-xs');
    const valid = check({
      'card.css': `${common}
.ui-card:not([data-dirty], [data-invalid]),
.ui-card[data-name='selected, other'] { padding: 8px; }`,
    });
    expect(valid.stderr).toBe('');
    expect(valid.status).toBe(0);
  });

  it('UIC-LABS-3.5 marks a dirty field with a uniform frame, not a bar', () => {
    const result = check({
      'card.css': `.ui-card[data-dirty] .ui-card__frame { border-inline-start: 3px solid var(--ref-accent); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('a dirty field marks its whole frame');
  });

  it('UIC-LABS-3.6 rejects state rules that size or place a box, unless marked exempt', () => {
    const result = check({
      'card.css': `.ui-card[data-selected] { font-weight: var(--ref-font-weight-strong); }
.ui-card[data-validation='invalid'] .ui-card__message { margin-top: 4px; }
.ui-card:hover { padding: 4px; }
.ui-card[data-focus-within] { display: block; /* layout-exempt: a skip link */ }
.ui-card[data-current] { color: var(--ref-text); background: var(--ref-canvas); }
.ui-card:not([data-dirty])::after { width: 26px; }
.ui-card[data-expanded] { height: 40px; }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('card.css:1: font-weight changes with a state');
    expect(result.stderr).toContain('card.css:2: margin-top changes with a state');
    expect(result.stderr).toContain('card.css:3: padding changes with a state');
    expect(result.stderr).not.toMatch(/card\.css:[4-7]:/);
  });

  it('UIC-LABS-3.7 sizes controls from the control scale at their own step', () => {
    const scale = base.replace(
      '  --ref-font-size-sm: 12px;\n',
      '  --ref-font-size-sm: 12px;\n  --ref-control-height-sm: 24px;\n  --ref-control-height-md: 28px;\n',
    );
    const result = check(
      {
        'card.css': `.ui-card { height: var(--ref-control-height-md); }
.ui-card[data-size='sm'] { height: var(--ref-control-height-md); }
.ui-card__chip[data-size='sm'] { height: 18px; }`,
        'tile.css': `.ui-tile { height: var(--ref-control-height-md); }
.ui-tile[data-size='sm'] { height: 26px; }`,
        'pill.css': `.ui-pill { height: var(--ref-control-height-md); }
.ui-pill[data-size='sm'] { height: calc(var(--ref-control-height-sm) - 2px); }`,
      },
      scale,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'card.css:2: a sm control takes --ref-control-height-sm, not --ref-control-height-md',
    );
    expect(result.stderr).toContain('tile.css:2: height "26px" sizes a control off the scale');
    expect(result.stderr).not.toMatch(/card\.css:3|pill\.css/);
  });

  it('UIC-LABS-3.8 rings a focused field frame with the thin focus token, never by hand', () => {
    const focus = `${base}:root { --ref-focus: var(--ref-accent); --ref-focus-ring-thin: 1px solid var(--ref-focus); }`;
    const common = `.ui-card { color: var(--ref-text); background: var(--ref-canvas); border-radius: var(--ref-radius); font-size: var(--ref-font-size-sm); }`;
    const result = check(
      {
        'card.css': `.ui-card:focus-within { border-color: var(--ref-focus); box-shadow: 0 0 0 1px var(--ref-focus); }
.ui-card__input:focus { outline: 2px solid var(--ref-focus); }
${common}`,
      },
      focus,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('card.css:1: box-shadow builds a focus ring by hand');
    expect(result.stderr).toContain('card.css:2: outline builds a focus ring by hand');
    const valid = check(
      {
        'card.css': `.ui-card:focus-within { border-color: var(--ref-focus); outline: var(--ref-focus-ring-thin); }
${common}`,
      },
      focus,
    );
    expect(valid.stderr).toBe('');
    expect(valid.status).toBe(0);
  });

  it('UIC-LABS-3.5 keeps glyph sizes, hidden text and hidden scrollbars in the base', () => {
    const result = check({
      'card.css': `.ui-card .ui-glyph { width: 14px; height: var(--ref-icon-size-md); }
.ui-card__label { clip-path: inset(50%); }
.ui-card__strip { scrollbar-width: none; }
.ui-card__note { clip-path: inset(50%); /* token-exempt: only in a query */ }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('card.css:1: width "14px" pins a glyph by hand');
    expect(result.stderr).not.toContain('height "var');
    expect(result.stderr).toContain('card.css:2: visually hidden by hand');
    expect(result.stderr).toContain('card.css:3: a scrollbar hidden by hand');
    expect(result.stderr).not.toContain('card.css:4');
  });

  it('UIC-LABS-3.5 checks the base outside its token blocks', () => {
    const result = check(
      { 'card.css': `.ui-card { color: var(--ref-text); background: var(--ref-canvas); }` },
      `${base}.ui-card__title { font-weight: 500; color: var(--ref-accent); border-radius: var(--ref-radius); font-size: var(--ref-font-size-sm); }
@media (prefers-reduced-motion: reduce) { .ui-card { transition-duration: 0s !important; } }`,
    );
    expect(result.stderr).toContain('base.css:12: font-weight "500" is not a weight token');
    expect(result.stderr).not.toContain('literal duration');
    expect(result.stderr).not.toContain('base.css:2');
  });

  it('UIC-LABS-3.1 names every container and every container query', () => {
    const named = check({
      'card.css': `.ui-card { container: ui-card / inline-size; }
@container ui-card (width < 20rem) { .ui-card__body { display: block; } }`,
    });
    expect(named.stderr).not.toContain('container');
    expect(named.stderr).not.toContain('threshold');
    const pixels = check({
      'card.css': `.ui-card { container: ui-card / inline-size; }
@container ui-card (width < 320px) { .ui-card__body { display: block; } }
@media (max-width: 700px) { .ui-card { display: block; } }`,
    });
    expect(pixels.stderr).toContain('card.css:2: a query threshold in px; use rem');
    expect(pixels.stderr).toContain('card.css:3: a query threshold in px; use rem');
    const unnamed = check({
      'card.css': `.ui-card { container-type: inline-size; }
@container (max-width: 20rem) { .ui-card__body { display: block; } }`,
    });
    expect(unnamed.status).toBe(1);
    expect(unnamed.stderr).toContain('card.css:1: an unnamed container');
    expect(unnamed.stderr).toContain('card.css:2: a container query without a name');
  });

  it('UIC-LABS-3.5 rejects custom properties outside the reference namespaces', () => {
    const result = check({
      'card.css': `.ui-card { --unscoped-theme: red; color: var(--misspelled-token); }
.ui-card__handle { --resize-handle-thickness: 10px; inline-size: var(--resize-handle-thickness); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'card.css:1: --unscoped-theme is outside the reference namespaces; name it --ref-<owner>-',
    );
    expect(result.stderr).toContain(
      'card.css:1: --misspelled-token is outside the reference namespaces',
    );
    expect(result.stderr).toContain(
      'card.css:2: --resize-handle-thickness is outside the reference namespaces',
    );
  });

  it('UIC-LABS-3.5 reads only measured properties a spec declares, and never defines them', () => {
    const result = check({
      'card.css': `.ui-card { inline-size: var(--ui-trigger-width); block-size: var(--ui-card-height); }
.ui-card__body { --ui-trigger-width: 4px; }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '--ui-card-height is not a measured property any spec declares',
    );
    expect(result.stderr).not.toContain('--ui-trigger-width is not a measured property');
    expect(result.stderr).toContain(
      'card.css:2: --ui-trigger-width is published by a component; the stylesheet only reads it',
    );
  });

  it('UIC-LABS-3.5 keeps third-party interop variables to the partials that style the engine', () => {
    const result = check({
      'pdf-viewer.css': `.ui-pdf-viewer__text-layer { --total-scale-factor: var(--ui-pdf-viewer-scale); font-size: calc(var(--total-scale-factor) * var(--min-font-size)); }`,
      'card.css': `.ui-card { block-size: var(--disclosure-panel-height); inline-size: calc(var(--min-font-size) * 1px); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain('reference/pdf-viewer.css');
    expect(result.stderr).toContain(
      'card.css:1: --disclosure-panel-height belongs to a third-party engine; use it only in disclosure.css, chat-activity.css',
    );
    expect(result.stderr).toContain('card.css:1: --min-font-size belongs to a third-party engine');
  });

  it("UIC-LABS-3.5 rejects a literal colour in a partial's own token", () => {
    const result = check({
      'card.css': `.ui-card { --ref-card-tone: #ff0000; --ref-card-mask: url("data:image/svg+xml,stroke='black'"); /* token-exempt: a mask's alpha */ color: var(--ref-card-tone); mask: var(--ref-card-mask); }`,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'card.css:1: literal colour in --ref-card-tone; use a colour token',
    );
    expect(result.stderr).not.toContain('--ref-card-mask');
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
