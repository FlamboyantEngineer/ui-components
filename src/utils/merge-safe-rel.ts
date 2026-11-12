// The library's one `rel` policy for links that open a new browsing context (specs/LINK.md).

const safeRel = ['noopener', 'noreferrer'];

/** The targets that keep the link in the current browsing context or one of its ancestors. */
const sameContextTargets = new Set(['', '_self', '_parent', '_top']);

/**
 * Whether a link `target` opens a new browsing context: `_blank` in any letter case and every
 * window name. Browsers imply `noopener` only for `_blank`, so a named window would otherwise get
 * `window.opener`.
 */
export function isNewContextTarget(target: string | undefined): boolean {
  return target !== undefined && !sameContextTargets.has(target.toLowerCase());
}

/**
 * The `rel` a link renders: the caller's tokens, joined by `noopener` and `noreferrer` when
 * `target` opens a new browsing context, so the opened page cannot reach back to this page or learn
 * where it came from. A target that stays in this context keeps the caller's `rel` as given.
 */
export function mergeSafeRel(
  target: string | undefined,
  rel: string | undefined,
): string | undefined {
  if (!isNewContextTarget(target)) return rel;
  const tokens = (rel ?? '').split(/\s+/).filter(Boolean);
  return [...tokens, ...safeRel.filter((token) => !tokens.includes(token))].join(' ');
}
