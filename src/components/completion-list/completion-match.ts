// Matching completions against the text typed before the caret: prefixes, then word starts.

/** A completion a text control or an editor offers. */
export interface Completion {
  /** The text shown and matched, and inserted unless `insertText` says otherwise. */
  label: string;
  /** A short explanation shown beside the label. */
  description?: string | undefined;
  /** What the completion is (`keyword`, `person`, `function`, …), published as `data-kind`. */
  kind?: string | undefined;
  /** Longer documentation shown beside the list while the completion is active. */
  documentation?: string | undefined;
  /** The text inserted in place of the label, such as a stored mention token. */
  insertText?: string | undefined;
}

const WORD_SEPARATOR = /[\s._\-/:]/;

function isWordStart(label: string, index: number): boolean {
  if (index === 0) return true;
  const previous = label[index - 1] ?? '';
  const character = label[index] ?? '';
  return (
    WORD_SEPARATOR.test(previous) ||
    (character !== character.toLowerCase() && previous === previous.toLowerCase())
  );
}

/** How many characters `query` skips in `lower` as a subsequence from `first`; `null` if it is not one. */
function measureGapsFrom(lower: string, query: string, first: number): number | null {
  let gaps = 0;
  let at = first + 1;
  for (const character of query.slice(1)) {
    const found = lower.indexOf(character, at);
    if (found === -1) return null;
    if (found > at) gaps += 1;
    at = found + 1;
  }
  return gaps;
}

/**
 * The fewest characters `query` skips in `label` as a subsequence starting at a word, trying every
 * word that starts with its first character; `null` if it is no such subsequence.
 */
function measureGaps(label: string, query: string): number | null {
  const lower = label.toLowerCase();
  let best: number | null = null;
  for (let index = 0; index < lower.length && best !== 0; index += 1) {
    if (lower[index] !== query[0] || !isWordStart(label, index)) continue;
    const gaps = measureGapsFrom(lower, query, index);
    if (gaps !== null && (best === null || gaps < best)) best = gaps;
  }
  return best;
}

/**
 * How well `label` matches `query`, ignoring case: 0 when it starts with it, 1 when a word in it
 * does, more for a scattered match whose characters start at a word; `null` for no match.
 */
export function scoreCompletion(label: string, query: string): number | null {
  const lower = label.toLowerCase();
  const needle = query.toLowerCase();
  if (lower.startsWith(needle)) return 0;
  const gaps = measureGaps(label, needle);
  return gaps === null ? null : 1 + gaps;
}

/**
 * The completions matching `query`, best first and otherwise in their order: labels that start
 * with it, then labels whose words hold its characters in order. A label equal to the query is
 * left out; an empty query keeps them all.
 */
export function matchCompletions(completions: readonly Completion[], query: string): Completion[] {
  if (!query) return [...completions];
  return completions
    .map((completion) => ({
      completion,
      score: scoreCompletion(completion.label, query),
    }))
    .filter(({ completion, score }) => score !== null && completion.label !== query)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map(({ completion }) => completion);
}
