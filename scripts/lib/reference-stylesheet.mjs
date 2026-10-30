// The reference stylesheet the package ships at labs/build/reference.css (UIC-LABS-1.6): one
// self-contained file a host copies into its own assets and serves as it is.

export const REFERENCE_STYLESHEET = 'labs/build/reference.css';

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
  for (const [, target] of css.matchAll(/url\(\s*['"]?([^'")\s]*)/gi)) {
    if (!target.startsWith('data:') && !target.startsWith('#')) {
      problems.push(`${REFERENCE_STYLESHEET} loads ${target}`);
    }
  }
  return problems;
}
