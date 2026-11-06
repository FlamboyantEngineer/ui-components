import { getSegmenter } from '../../utils/intl-format.js';

/** A match in the text around it. */
export interface SearchSnippetSource {
  /** The text around the match, as the document holds it. */
  source: string;
  /** Where the match starts in `source`, as a UTF-16 offset. */
  start: number;
  /** Where the match ends in `source`, exclusive. */
  end: number;
}

/** How much context a snippet keeps around its match. */
export interface SearchSnippetOptions {
  /** The most characters kept before the match. Defaults to 40. */
  beforeLength?: number | undefined;
  /** The most characters kept after the match. Defaults to 80. */
  afterLength?: number | undefined;
  /** The locale whose word boundaries the context ends on. */
  locale?: string | undefined;
}

/** One line of text around a match, cut at whole words, with where it lies in the source. */
export interface SearchSnippetData {
  /** The context before the words next to the match, which a narrow row gives up first. */
  lead: string;
  /** The words immediately before the match. */
  near: string;
  match: string;
  after: string;
  /** Text before the snippet was left out. */
  isStartOmitted: boolean;
  /** Text after the snippet was left out. */
  isEndOmitted: boolean;
  /** Where the snippet starts in the source. */
  start: number;
  /** Where the snippet ends in the source, exclusive. */
  end: number;
}

interface WordSegment {
  index: number;
  end: number;
  isSpace: boolean;
  isWordLike: boolean;
}

/** The context a snippet keeps on each side by default. */
const defaultBefore = 40;
const defaultAfter = 80;

const spaceRun = /\s+/gu;
const onlySpace = /^\s+$/u;

/** A stretch of the source whose ends are grapheme boundaries whatever surrounds them. */
interface SegmentWindow {
  from: number;
  to: number;
  locale?: string | undefined;
}

/**
 * Whether a grapheme boundary at `offset` holds however the text before it reads: an end of the
 * text, or two ASCII characters other than CR LF, which no grapheme rule joins (no ASCII character
 * extends, prepends, joins or pairs as a flag half).
 */
function isSafeBoundary(source: string, offset: number): boolean {
  if (offset <= 0 || offset >= source.length) return true;
  const before = source.charCodeAt(offset - 1);
  const after = source.charCodeAt(offset);
  return before < 0x80 && after < 0x80 && !(before === 13 && after === 10);
}

/**
 * The window around `from` and `to` to segment: widened to the nearest safe boundaries, so its
 * segments match those of the whole source (a flag's halves pair as they do there, and a cluster
 * longer than the window stays whole), at the cost of segmenting a little more.
 */
function widenWindow(source: string, window: SegmentWindow): SegmentWindow {
  let { from, to } = window;
  while (!isSafeBoundary(source, from)) from -= 1;
  while (!isSafeBoundary(source, to)) to += 1;
  return { ...window, from, to };
}

/** The word segments of `source` in `window`, with offsets in the source. */
function segmentWords(source: string, window: SegmentWindow) {
  const segmenter = getSegmenter(window.locale, { granularity: 'word' });
  const text = source.slice(window.from, window.to);
  return Array.from(segmenter.segment(text), ({ segment, index, isWordLike }): WordSegment => ({
    index: window.from + index,
    end: window.from + index + segment.length,
    isSpace: onlySpace.test(segment),
    isWordLike: Boolean(isWordLike),
  }));
}

/**
 * The grapheme boundary nearest `offset` on the side `toward` names, so a cut never splits one. The
 * window's ends are boundaries of the whole source, so the boundaries inside it are too.
 */
function alignToGrapheme(
  source: string,
  { offset, toward, window }: { offset: number; toward: 'start' | 'end'; window: SegmentWindow },
): number {
  const segmenter = getSegmenter(undefined, { granularity: 'grapheme' });
  let previous = window.from;
  for (const { index } of segmenter.segment(source.slice(window.from, window.to))) {
    const boundary = window.from + index;
    if (boundary === offset) return offset;
    if (boundary > offset) return toward === 'start' ? previous : boundary;
    previous = boundary;
  }
  return toward === 'start' ? previous : window.to;
}

/**
 * Where the snippet starts: the source's start when it is near, else the earliest word within
 * reach, else a cut through a word too long to keep whole.
 */
function findSnippetStart(
  source: SearchSnippetSource,
  { segments, window }: { segments: readonly WordSegment[]; window: SegmentWindow },
  reach: number,
) {
  const limit = source.start - reach;
  if (limit <= 0) return 0;
  // The first segment may begin mid-word, where the segmented range was cut.
  const word = segments.find(
    (segment, position) =>
      position > 0 && !segment.isSpace && segment.index >= limit && segment.index < source.start,
  );
  return word
    ? word.index
    : alignToGrapheme(source.source, { offset: limit, toward: 'end', window });
}

/** Where the snippet ends: the source's end when it is near, else the last word within reach. */
function findSnippetEnd(
  source: SearchSnippetSource,
  { segments, window }: { segments: readonly WordSegment[]; window: SegmentWindow },
  reach: number,
) {
  const limit = source.end + reach;
  if (limit >= source.source.length) return source.source.length;
  // The last segment may end mid-word, where the segmented range was cut.
  const words = segments.filter(
    (segment, position) =>
      position < segments.length - 1 &&
      !segment.isSpace &&
      segment.end <= limit &&
      segment.end > source.end,
  );
  const word = words.at(-1);
  return word
    ? word.end
    : alignToGrapheme(source.source, { offset: limit, toward: 'start', window });
}

/** Where the words next to the match start: the last whole word before it, kept with what follows. */
function findNearStart(segments: readonly WordSegment[], from: number, matchStart: number): number {
  const words = segments.filter(
    (segment) => segment.isWordLike && segment.index >= from && segment.end <= matchStart,
  );
  return words.at(-1)?.index ?? from;
}

/** Writes each run of spaces and line breaks as one space, across the parts, so the snippet is one line. */
function collapseSpaces(parts: readonly string[]): string[] {
  let isAfterSpace = false;
  return parts.map((part) => {
    let text = part.replace(spaceRun, ' ');
    if (isAfterSpace && text.startsWith(' ')) text = text.slice(1);
    if (text) isAfterSpace = text.endsWith(' ');
    return text;
  });
}

/**
 * Builds the one-line snippet that shows a match in its context: whole words before and after it,
 * within `beforeLength` and `afterLength` characters, every space run written as one space, and
 * flags for where text was left out. A word too long to keep whole is cut between graphemes.
 */
export function buildSearchSnippet(
  source: SearchSnippetSource,
  options: SearchSnippetOptions = {},
): SearchSnippetData {
  const { beforeLength = defaultBefore, afterLength = defaultAfter, locale } = options;
  const text = source.source;
  const start = Math.min(Math.max(0, source.start), text.length);
  const end = Math.min(Math.max(start, source.end), text.length);
  const match = { source: text, start, end };
  const window = widenWindow(text, {
    from: Math.max(0, start - beforeLength * 2),
    to: Math.min(text.length, end + afterLength * 2),
    locale,
  });
  const segmented = { segments: segmentWords(text, window), window };
  const snippetStart = findSnippetStart(match, segmented, beforeLength);
  const snippetEnd = findSnippetEnd(match, segmented, afterLength);
  const { segments } = segmented;
  const nearStart = findNearStart(segments, snippetStart, start);
  const [lead = '', near = '', matched = '', after = ''] = collapseSpaces([
    text.slice(snippetStart, nearStart),
    text.slice(nearStart, start),
    text.slice(start, end),
    text.slice(end, snippetEnd),
  ]);
  return {
    ...{ lead, near, match: matched, after },
    isStartOmitted: snippetStart > 0,
    isEndOmitted: snippetEnd < text.length,
    start: snippetStart,
    end: snippetEnd,
  };
}
