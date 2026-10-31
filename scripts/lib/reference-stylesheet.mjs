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

/** Rules the shipped sheet must carry, so a stale or partial bundle fails the package checks. */
const REQUIRED_RULES = [
  '.ui-field[data-density=compact]',
  '.ui-card[data-density=compact]',
  '.ui-button',
];

/** What keeps a built reference stylesheet from being copied and served alone, if anything. */
export function referenceStylesheetProblems(css) {
  const problems = [];
  for (const rule of REQUIRED_RULES) {
    if (!css.includes(rule)) problems.push(`${REFERENCE_STYLESHEET} lacks ${rule}`);
  }
  if (/@import/i.test(css)) problems.push(`${REFERENCE_STYLESHEET} imports another stylesheet`);
  if (!new RegExp(`^\\s*@layer ${REFERENCE_LAYER}\\s*\\{`).test(css)) {
    problems.push(`${REFERENCE_STYLESHEET} does not sit in the ${REFERENCE_LAYER} layer`);
  }
  // The labs' own page rules stay in the labs (UIC-LABS-3.1).
  for (const [selector] of css.matchAll(/#lab-[\w-]+|\[data-lab-[\w-]+/g)) {
    problems.push(`${REFERENCE_STYLESHEET} styles the lab page (${selector})`);
  }
  for (const [, target] of css.matchAll(/url\(\s*['"]?([^'")\s]*)/gi)) {
    if (!target.startsWith('data:') && !target.startsWith('#')) {
      problems.push(`${REFERENCE_STYLESHEET} loads ${target}`);
    }
  }
  return problems;
}
