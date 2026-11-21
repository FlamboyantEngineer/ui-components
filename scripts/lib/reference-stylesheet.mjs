// The reference stylesheet the package ships at labs/build/reference.css (UIC-LABS-1.6): one
// self-contained file a host copies into its own assets and serves as it is.

export const REFERENCE_STYLESHEET = 'labs/build/reference.css';

/**
 * The oldest browsers the reference stylesheet supports (UIC-LABS-1.6): subgrid sets Chrome and Edge
 * 117, `:has()` Firefox 121, and `contain-intrinsic-inline-size` Safari 17. `package.json` states
 * the same floor as a `browserslist` for hosts.
 */
export const BROWSER_FLOOR = { chrome: 117, edge: 117, firefox: 121, safari: 17, ios_saf: 17 };

/** The floor as esbuild targets, so the build lowers or prefixes what an older floor browser lacks. */
export const BROWSER_TARGETS = Object.entries(BROWSER_FLOOR).map(
  ([browser, version]) => `${browser === 'ios_saf' ? 'ios' : browser}${version}`,
);

/** The cascade layer every reference rule sits in, so any unlayered host rule wins over it. */
export const REFERENCE_LAYER = 'ui-reference';

/** The shadcn/ui stylesheet's default token values, below every other layer (UIC-LABS-1.11). */
export const SHADCN_TOKENS_LAYER = 'ui-shadcn-tokens';

/** The shadcn/ui stylesheet's bridge and component partials, above the reference partials it reuses. */
export const SHADCN_LAYER = 'ui-shadcn';

/** Rules the shipped sheet must carry, so a stale or partial bundle fails the package checks. */
const REQUIRED_RULES = [
  '.ui-field[data-density=compact]',
  '.ui-card[data-density=compact]',
  '.ui-button',
];

/** The preludes of a stylesheet's top-level blocks, skipping comments and quoted text. */
function topLevelBlocks(css) {
  const preludes = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
    } else if (character === '"' || character === "'") quote = character;
    else if (character === '{') {
      if (depth === 0) preludes.push(text.slice(start, index).trim());
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) start = index + 1;
    } else if (character === ';' && depth === 0) start = index + 1;
  }
  return preludes;
}

/** Problems that keep a built stylesheet from being copied and served alone, whichever sheet. */
function selfContainedProblems(file, css) {
  const problems = [];
  if (/@import/i.test(css)) problems.push(`${file} imports another stylesheet`);
  // The labs' own page rules stay in the labs (UIC-LABS-3.1).
  for (const [selector] of css.matchAll(/#lab-[\w-]+|\[data-lab-[\w-]+/g)) {
    problems.push(`${file} styles the lab page (${selector})`);
  }
  for (const [, target] of css.matchAll(/url\(\s*['"]?([^'")\s]*)/gi)) {
    if (!target.startsWith('data:') && !target.startsWith('#')) {
      problems.push(`${file} loads ${target}`);
    }
  }
  return problems;
}

/** What keeps a built reference stylesheet from being copied and served alone, if anything. */
export function referenceStylesheetProblems(css) {
  const problems = [];
  for (const rule of REQUIRED_RULES) {
    if (!css.includes(rule)) problems.push(`${REFERENCE_STYLESHEET} lacks ${rule}`);
  }
  if (!new RegExp(`^\\s*@layer ${REFERENCE_LAYER}\\s*\\{`).test(css)) {
    problems.push(`${REFERENCE_STYLESHEET} does not sit in the ${REFERENCE_LAYER} layer`);
  }
  return [...problems, ...selfContainedProblems(REFERENCE_STYLESHEET, css)];
}

/** The shadcn/ui stylesheet the package ships beside the reference one (UIC-LABS-1.11). */
export const SHADCN_STYLESHEET = 'labs/build/shadcn.css';

/** Rules the shipped shadcn/ui sheet must carry: the reference partials, its bridge and a component partial. */
const SHADCN_REQUIRED_RULES = [
  ...REQUIRED_RULES,
  '--ref-accent: var(--primary)',
  '.ui-tabs__list:not([data-orientation=vertical])',
];

/** What keeps a built shadcn/ui stylesheet from being served alone in its layers, if anything. */
export function shadcnStylesheetProblems(css) {
  const problems = [];
  for (const rule of SHADCN_REQUIRED_RULES) {
    if (!css.includes(rule)) problems.push(`${SHADCN_STYLESHEET} lacks ${rule}`);
  }
  const order = new RegExp(
    `^\\s*@layer\\s+${SHADCN_TOKENS_LAYER}\\s*,\\s*${REFERENCE_LAYER}\\s*,\\s*${SHADCN_LAYER}\\s*;`,
  );
  if (!order.test(css)) {
    problems.push(
      `${SHADCN_STYLESHEET} does not open by ordering its layers ${SHADCN_TOKENS_LAYER}, ${REFERENCE_LAYER}, ${SHADCN_LAYER}`,
    );
  }
  // Every rule sits in one of the three layers, so a host's unlayered rules and tokens win.
  const layers = new Set([SHADCN_TOKENS_LAYER, REFERENCE_LAYER, SHADCN_LAYER]);
  for (const prelude of topLevelBlocks(css)) {
    const layer = /^@layer\s+([\w-]+)$/.exec(prelude)?.[1];
    if (!layer || !layers.has(layer)) {
      problems.push(`${SHADCN_STYLESHEET} has a rule outside its layers (${prelude.slice(0, 60)})`);
    }
  }
  return [...problems, ...selfContainedProblems(SHADCN_STYLESHEET, css)];
}
