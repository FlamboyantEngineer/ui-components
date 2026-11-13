interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}

const segmenter = createSegmenter();

function createSegmenter(): GraphemeSegmenter | null {
  return typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
}

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

/**
 * The first letter or digit of `name` in any script, upper-cased, skipping leading symbols, emoji
 * and punctuation; `undefined` when the name has none. The letter is a whole user-perceived
 * character, so a letter with combining marks stays whole, and one whose capital is two letters,
 * such as `ß`, keeps its own form.
 */
export function getLeadingLetter(name: string): string | undefined {
  const letter = graphemes(name).find((character) => /^[\p{L}\p{N}]/u.test(character));
  if (letter === undefined) return undefined;
  const capital = letter.toUpperCase();
  return graphemes(capital).length === 1 ? capital : letter;
}
