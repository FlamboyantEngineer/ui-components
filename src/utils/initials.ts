interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}

function createSegmenter(): GraphemeSegmenter | null {
  return typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
}

const segmenter = createSegmenter();

/** Splits text into user-perceived characters, or code points where the runtime cannot segment. */
function graphemes(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
}

/**
 * The initials for a display name: the first character of the first and last words of a name with
 * several words, otherwise the first two characters, upper-cased; `?` for a blank name. Characters are
 * user-perceived characters, so a leading emoji sequence stays whole.
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.at(-1);
  if (first !== undefined && last !== undefined && words.length >= 2) {
    return `${graphemes(first)[0] ?? ''}${graphemes(last)[0] ?? ''}`.toUpperCase();
  }
  return graphemes(trimmed).slice(0, 2).join('').toUpperCase() || '?';
}
