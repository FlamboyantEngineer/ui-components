/**
 * Joins element ids into an ARIA reference list (`aria-describedby`, `aria-controls`, …), skipping
 * absent ones; `undefined` when none is left, so the attribute is not rendered.
 */
export function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}
