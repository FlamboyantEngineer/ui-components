import { requireDefined } from '../../utils/require-defined.js';
// Closes the inline syntax a streaming paragraph leaves open, so its end renders as it will once
// complete instead of flashing raw markers (specs/MARKDOWN.md, UIC-MARKDOWN-2.11). Pure text in,
// text out: the parser stays as it is.

interface Span {
  start: number;
  end: number;
}

interface Bracket {
  /** Where the construct starts: its `[`, or the `!` of an image. */
  start: number;
  /** Where its label starts, after the `[`. */
  label: number;
  isImage: boolean;
}

interface Delimiter extends Span {
  char: string;
}

/** Characters after which a delimiter run may open emphasis besides whitespace. */
const openingChars: ReadonlySet<string> = new Set([...'([{"\'“‘*_~']);

const partialAutolink = /<[A-Za-z][A-Za-z0-9.+-]{1,31}:[^\s<>]*$/;

const isWhitespace = (char: string) => char === '' || /\s/.test(char);

const isPunctuation = (char: string) => /[\p{P}\p{S}]/u.test(char);

function isEscaped(text: string, at: number): boolean {
  let count = 0;
  for (let index = at - 1; index >= 0 && text[index] === '\\'; index -= 1) count += 1;
  return count % 2 === 1;
}

/** The first run from `from` that is `length` backticks long, or -1. */
function findRunOfLength(runs: readonly Span[], from: number, length: number): number {
  for (let at = from; at < runs.length; at += 1) {
    const run = requireDefined(runs[at]);
    if (run.end - run.start === length) return at;
  }
  return -1;
}

/** Index just past the last character of `text` before `end` that is not whitespace. */
function contentEnd(text: string, end = text.length): number {
  let at = end;
  while (at > 0 && isWhitespace(text.charAt(at - 1))) at -= 1;
  return at;
}

/** The code spans of the text, and the first backtick run that no run of its length closes. */
function findCodeSpans(text: string): { spans: Span[]; open: Span | null } {
  const runs = [...text.matchAll(/`+/g)]
    .filter((match) => !isEscaped(text, match.index))
    .map((match) => ({ start: match.index, end: match.index + match[0].length }));
  const spans: Span[] = [];
  for (let index = 0; index < runs.length; index += 1) {
    const opener = requireDefined(runs[index]);
    const length = opener.end - opener.start;
    const closer = findRunOfLength(runs, index + 1, length);
    if (closer === -1) return { spans, open: opener };
    spans.push({ start: opener.start, end: requireDefined(runs[closer]).end });
    index = closer;
  }
  return { spans, open: null };
}

/** The text with code spans blanked out, so their content is never read as syntax. */
function maskCode(text: string): string {
  let masked = '';
  let from = 0;
  for (const { start, end } of findCodeSpans(text).spans) {
    masked += text.slice(from, start) + 'a'.repeat(end - start);
    from = end;
  }
  return masked + text.slice(from);
}

/** Closes a code span left open, or drops a backtick run that nothing follows yet. */
function closeCodeSpan(text: string): string {
  const { open } = findCodeSpans(text);
  if (!open) return text;
  if (text.slice(open.end).trim() === '') return text.slice(0, open.start);
  return text + '`'.repeat(open.end - open.start);
}

/** Where a link destination that starts at `from` ends at its closing parenthesis, or -1. */
function findDestinationEnd(text: string, from: number): number {
  let depth = 0;
  for (let index = from; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(' && !isEscaped(text, index)) depth += 1;
    if (char === ')' && !isEscaped(text, index)) {
      if (depth === 0) return index;
      depth -= 1;
    }
  }
  return -1;
}

/** A label that stays as written at the end: a citation number, or a task marker. */
function keepsBrackets(label: string): boolean {
  return /^[\d\s,]*$/.test(label) || /^[ xX]$/.test(label);
}

/**
 * Shows only the label of a link whose destination is still arriving, or of a bracketed label that
 * ends the text and may become a link; drops an image until it is complete. Returns null when the
 * closed bracket needs nothing.
 */
function repairClosedBracket(
  { text, masked, end }: LinkText,
  bracket: Bracket,
  close: number,
): string | null {
  const isLast = close + 1 >= end;
  const destination = masked[close + 1] === '(' ? findDestinationEnd(masked, close + 2) : null;
  const label = text.slice(bracket.label, close);
  if (destination === -1 || (isLast && !keepsBrackets(label))) {
    return bracket.isImage
      ? text.slice(0, bracket.start)
      : text.slice(0, bracket.start) + label + (isLast ? text.slice(close + 1) : '');
  }
  return null;
}

/** The text a link repair reads: as written, with code masked, and where its content ends. */
interface LinkText {
  text: string;
  masked: string;
  end: number;
}

/** Drops the brackets left open: a citation or image still being typed goes, other text stays. */
function dropOpenBrackets(text: string, open: readonly Bracket[]): string {
  let limit = text.length;
  let dropped: Bracket[] = [];
  // Whether the text kept after the bracket last looked at is only digits, and where it starts.
  let isRestDigits = true;
  let restStart = limit;
  for (const bracket of [...open].reverse()) {
    const isDigits = isRestDigits && /^\d*$/.test(text.slice(bracket.label, restStart));
    if (bracket.isImage || isDigits) {
      [limit, dropped, isRestDigits, restStart] = [bracket.start, [], true, bracket.start];
    } else {
      dropped.push(bracket);
      [isRestDigits, restStart] = [false, bracket.start];
    }
  }
  let result = '';
  let from = 0;
  for (const bracket of dropped.reverse()) {
    result += text.slice(from, bracket.start);
    from = bracket.label;
  }
  return result + text.slice(from, limit);
}

/** Repairs the link or image the text ends inside, and brackets that are still open. */
function repairLinks(source: string): string {
  const text = source.replace(partialAutolink, '');
  const masked = maskCode(text);
  const linkText: LinkText = { text, masked, end: contentEnd(text) };
  const open: Bracket[] = [];
  let isEscapedHere = false;
  for (let at = 0; at < masked.length; at += 1) {
    const isEscapedChar: boolean = isEscapedHere;
    isEscapedHere = !isEscapedChar && masked[at] === '\\';
    if (isEscapedChar) continue;
    if (masked[at] === '[') {
      const isImage = masked[at - 1] === '!' && !isEscaped(masked, at - 1);
      open.push({ start: isImage ? at - 1 : at, label: at + 1, isImage });
    } else if (masked[at] === ']' && open.length > 0) {
      const bracket = requireDefined(open.pop());
      const repaired = repairClosedBracket(linkText, bracket, at);
      if (repaired !== null) return dropOpenBrackets(repaired, open);
      if (masked[at + 1] === '(') at = findDestinationEnd(masked, at + 2);
    }
  }
  return dropOpenBrackets(text, open);
}

function readDelimiters(masked: string): Delimiter[] {
  return [...masked.matchAll(/\*+|_+|~+/g)]
    .filter((match) => !match[0].startsWith('~') || match[0].length === 2)
    .map((match) => ({
      char: match[0].charAt(0),
      start: match.index,
      end: match.index + match[0].length,
    }));
}

/**
 * CommonMark's flanking rules, except that emphasis never opens inside a word or a URL, and a run
 * at the end that would open emphasis is kept as an opener.
 */
function readFlanking(text: string, run: Delimiter, end: number) {
  const previous = text.charAt(run.start - 1);
  const next = text.charAt(run.end);
  if (previous === '\\') return { canOpen: false, canClose: false };
  const left =
    !isWhitespace(next) &&
    (!isPunctuation(next) || isWhitespace(previous) || isPunctuation(previous));
  const right =
    !isWhitespace(previous) &&
    (!isPunctuation(previous) || isWhitespace(next) || isPunctuation(next));
  // A run that ends the text may still open emphasis once its content arrives.
  const isLast = run.end >= end;
  return {
    canOpen: (left || isLast) && (isWhitespace(previous) || openingChars.has(previous)),
    canClose: right && (run.char !== '_' || !left || isPunctuation(next)),
  };
}

/** Closes the openers left on the stack, innermost first, dropping those nothing follows. */
function closeOpeners(text: string, openers: readonly Delimiter[]): string {
  let limit = text.length;
  let closers = '';
  for (const opener of [...openers].reverse()) {
    if (closers === '' && opener.end >= contentEnd(text, limit)) limit = opener.start;
    else closers += opener.char.repeat(opener.end - opener.start);
  }
  const end = contentEnd(text, limit);
  return text.slice(0, end) + closers + text.slice(end, limit);
}

/** Closes the emphasis, strong and strikethrough runs left open, dropping those nothing follows. */
function closeEmphasis(text: string): string {
  const masked = maskCode(text);
  const end = contentEnd(masked);
  const stack: Delimiter[] = [];
  // Stack positions of each character's openers, so a closer finds its own without a scan.
  const positions = new Map<string, number[]>();
  let result = text;
  for (const run of readDelimiters(masked)) {
    const { canOpen, canClose } = readFlanking(masked, run, end);
    const at = canClose ? (positions.get(run.char)?.at(-1) ?? -1) : -1;
    if (at === -1) {
      if (!canOpen) continue;
      const list = positions.get(run.char) ?? [];
      list.push(stack.length);
      positions.set(run.char, list);
      stack.push(run);
      continue;
    }
    const opener = requireDefined(stack[at]);
    const missing = opener.end - opener.start - (run.end - run.start);
    stack.length = at;
    for (const list of positions.values()) while ((list.at(-1) ?? -1) >= at) list.pop();
    // A closing run still arriving at the end gets the rest of its length.
    if (missing > 0 && run.end >= end) {
      result = result.slice(0, run.end) + run.char.repeat(missing) + result.slice(run.end);
    }
  }
  return closeOpeners(result, stack);
}

/**
 * Closes what the end of a streaming paragraph leaves open: a code span, emphasis, strong and
 * strikethrough runs, a link whose destination is still arriving (shown as its label) and an image
 * or autolink not yet complete (held back).
 */
export function closeStreamingInlines(text: string): string {
  return closeEmphasis(repairLinks(closeCodeSpan(text)));
}
