import type { Key } from '../core/props.js';
import { requireDefined } from './require-defined.js';

/** A point of a container's content that has a match in the other containers. */
export interface ScrollAnchor {
  /** Identifies the anchor across containers. */
  key: Key;
  /** Its distance from the top of the container's content, in pixels. */
  offset: number;
}

/** The index of the last pair whose source offset is at most `offset`, or -1. */
function findPair(pairs: ReadonlyArray<readonly [number, number]>, offset: number): number {
  let low = 0;
  let high = pairs.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (requireDefined(pairs[middle])[0] <= offset) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

/**
 * Maps a scroll offset of one container onto another through the anchors both have: between two
 * matched anchors the offset moves in proportion, before the first and after the last it keeps its
 * distance from that anchor. Without a matched anchor the offset is returned unchanged.
 */
export function mapScrollOffset(
  offset: number,
  from: readonly ScrollAnchor[],
  to: readonly ScrollAnchor[],
): number {
  const targets = new Map(to.map((anchor) => [anchor.key, anchor.offset]));
  const pairs = from.flatMap((anchor): Array<readonly [number, number]> => {
    const target = targets.get(anchor.key);
    return target === undefined ? [] : [[anchor.offset, target]];
  });
  const first = pairs[0];
  if (!first) return offset;
  const index = findPair(pairs, offset);
  if (index < 0) return first[1] - (first[0] - offset);
  const [start, startTarget] = requireDefined(pairs[index]);
  const next = pairs[index + 1];
  if (!next || next[0] <= start) return startTarget + (offset - start);
  return startTarget + ((offset - start) / (next[0] - start)) * (next[1] - startTarget);
}
