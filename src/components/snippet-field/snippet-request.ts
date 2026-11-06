// What a snippet field asks its host for: a source and, optionally, the lines to take from it.

/** The first and last line to take, counted from 1. */
export interface SnippetLines {
  start: number;
  end: number;
}

/** A snippet's address: the source it comes from and its lines, or `null` for the whole source. */
export interface SnippetRequest {
  source: string;
  lines: SnippetLines | null;
}

/** The lines the reader typed, read: a range, the whole source, or why they name neither. */
export type SnippetLinesRead =
  { ok: true; lines: SnippetLines | null } | { ok: false; reason: 'incomplete' | 'order' };

/** Whether two requests name the same source and lines. */
export function isSameSnippetRequest(left: SnippetRequest, right: SnippetRequest): boolean {
  return (
    left.source === right.source &&
    left.lines?.start === right.lines?.start &&
    left.lines?.end === right.lines?.end
  );
}

/** Reads typed whole numbers: both blank takes the whole source; one blank or a reversed range fails. */
export function readSnippetLines(start: string, end: string): SnippetLinesRead {
  if (start.trim() === '' && end.trim() === '') return { ok: true, lines: null };
  const first = Number(start);
  const last = Number(end);
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < 1) {
    return { ok: false, reason: 'incomplete' };
  }
  if (last < first) return { ok: false, reason: 'order' };
  return { ok: true, lines: { start: first, end: last } };
}

/** The typed text of a request's lines: blank for the whole source. */
export function toSnippetLinesText(lines: SnippetLines | null) {
  return { start: lines ? String(lines.start) : '', end: lines ? String(lines.end) : '' };
}
