// Splits highlighting tokens where the editor's decorations start and end, so the highlighted copy
// can wrap each piece in the marks that cover it.

import type { FieldSeverity } from '../field/field.js';
import type { CodeToken } from './code-layers.js';
import type { CodeRange } from './code-ranges.js';

/** What the highlighted copy marks on top of the tokens. */
export interface CodeDecorations {
  /** Diagnostic ranges, underlined. */
  marks: ReadonlyArray<CodeRange & { severity: FieldSeverity }>;
  /** Search matches, in order and without overlaps. */
  matches: ReadonlyArray<CodeRange & { isCurrent: boolean }>;
  /** The bracket at the caret and its partner. */
  brackets: ReadonlyArray<CodeRange & { isUnmatched: boolean }>;
  /** Where the caret marker goes, or `null`. */
  caret: number | null;
}

/** A piece of a token and the decorations that cover all of it. */
export interface CodeSegment {
  text: string;
  type: string | null;
  severity: FieldSeverity | null;
  match: { isCurrent: boolean } | null;
  bracket: { isUnmatched: boolean } | null;
}

function collectCuts({ marks, matches, brackets, caret }: CodeDecorations): number[] {
  const cuts = new Set<number>(caret === null ? [] : [caret]);
  for (const range of [...marks, ...matches, ...brackets]) {
    cuts.add(range.start);
    cuts.add(range.end);
  }
  return [...cuts].sort((a, b) => a - b);
}

function covering<T extends CodeRange>(ranges: readonly T[], offset: number): T | undefined {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const range = ranges[middle] as T;
    if (offset < range.start) high = middle - 1;
    else if (offset >= range.end) low = middle + 1;
    else return range;
  }
  return undefined;
}

function worstSeverity(decorations: CodeDecorations, offset: number): FieldSeverity | null {
  let worst: FieldSeverity | null = null;
  for (const { start, end, severity } of decorations.marks) {
    if (offset >= start && offset < end && worst !== 'error') worst = severity;
  }
  return worst;
}

function toSegment(
  piece: { text: string; type: string | null; at: number },
  decorations: CodeDecorations,
): CodeSegment {
  const { text, type, at } = piece;
  const match = covering(decorations.matches, at);
  const bracket = decorations.brackets.find(({ start, end }) => at >= start && at < end);
  return {
    text,
    type,
    severity: worstSeverity(decorations, at),
    match: match ? { isCurrent: match.isCurrent } : null,
    bracket: bracket ? { isUnmatched: bracket.isUnmatched } : null,
  };
}

/**
 * The tokens cut into segments at every decoration boundary, each with the decorations covering
 * it, and the caret marker (`null`) at its offset.
 */
export function splitSegments(
  tokens: readonly CodeToken[],
  decorations: CodeDecorations,
): Array<CodeSegment | null> {
  const cuts = collectCuts(decorations);
  const segments: Array<CodeSegment | null> = [];
  let offset = 0;
  let next = 0;
  for (const { text, type = null } of tokens) {
    const end = offset + text.length;
    let from = offset;
    while (from < end) {
      while (next < cuts.length && (cuts[next] ?? 0) <= from) next += 1;
      const to = Math.min(end, cuts[next] ?? end);
      if (from === decorations.caret) segments.push(null);
      segments.push(
        toSegment({ text: text.slice(from - offset, to - offset), type, at: from }, decorations),
      );
      from = to;
    }
    offset = end;
  }
  if (decorations.caret !== null && decorations.caret >= offset) segments.push(null);
  return segments;
}
