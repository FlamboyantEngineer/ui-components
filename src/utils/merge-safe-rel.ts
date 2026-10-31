// The library's one `rel` policy for links that open a new tab (specs/LINK.md).

const safeRel = ['noopener', 'noreferrer'];

/**
 * The `rel` a link renders: the caller's tokens, joined by `noopener` and `noreferrer` when
 * `target` is `_blank`, so the new tab cannot reach back to this page or learn where it came from.
 * Any other target keeps the caller's `rel` as given.
 */
export function mergeSafeRel(
  target: string | undefined,
  rel: string | undefined,
): string | undefined {
  if (target !== '_blank') return rel;
  const tokens = (rel ?? '').split(/\s+/).filter(Boolean);
  return [...tokens, ...safeRel.filter((token) => !tokens.includes(token))].join(' ');
}
