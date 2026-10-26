// Splits an attribution template (`Edited {time} by {person}`) into literal text and its parts.

/** One piece of a template: literal text, the time or the person. */
export type AttributionSegment =
  | { kind: 'text'; text: string; offset: number }
  | { kind: 'time' | 'person'; offset: number };

const tokenPattern = /\{(time|person)\}/g;

/**
 * The template's literal text, `{time}` and `{person}` tokens in order, each with its offset in the
 * template as a stable key. Other braces stay literal.
 */
export function parseAttributionTemplate(template: string): AttributionSegment[] {
  const segments: AttributionSegment[] = [];
  let last = 0;
  for (const match of template.matchAll(tokenPattern)) {
    if (match.index > last) {
      segments.push({ kind: 'text', text: template.slice(last, match.index), offset: last });
    }
    segments.push({ kind: match[1] as 'time' | 'person', offset: match.index });
    last = match.index + match[0].length;
  }
  if (last < template.length) {
    segments.push({ kind: 'text', text: template.slice(last), offset: last });
  }
  return segments;
}

/** Whether the time token starts the sentence: no visible text comes before it. */
export function isTimeFirst(segments: readonly AttributionSegment[]): boolean {
  const index = segments.findIndex((segment) => segment.kind === 'time');
  return segments
    .slice(0, Math.max(index, 0))
    .every((segment) => segment.kind === 'text' && segment.text.trim() === '');
}
