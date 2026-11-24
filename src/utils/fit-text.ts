import { getSegmenter } from './intl-format.js';

/** The longest grapheme prefix fitting in `room` UTF-16 units, as native text limits count. */
export function fitText(text: string, room: number): string {
  if (text.length <= room) return text;
  const characters =
    typeof Intl.Segmenter === 'function'
      ? getSegmenter(undefined, { granularity: 'grapheme' }).segment(text)
      : text;
  let length = 0;
  for (const part of characters) {
    const size = typeof part === 'string' ? part.length : part.segment.length;
    if (length + size > room) break;
    length += size;
  }
  return text.slice(0, length);
}
