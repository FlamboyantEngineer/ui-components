import type { Node as DocNode } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { FieldSeverity } from '../field/field.js';

/**
 * A finding the host reports about a run of top-level blocks, such as a broken reference its own
 * check found. The editor checks nothing itself: it marks the blocks and the scroll track.
 */
export interface RichTextBlockMarker {
  /** The first block, as an index into the document's `content`. */
  block: number;
  /** The last block, when the marker spans several. Defaults to `block`. */
  endBlock?: number | undefined;
  /** Defaults to `error`. */
  severity?: FieldSeverity | undefined;
  /** What is wrong, read out with the marked blocks. */
  message: string;
}

/** A marker resolved against the document: the positions its first and last blocks start at. */
export interface PlacedMarker {
  from: number;
  /** The position the last block starts at. */
  last: number;
  /** The position after the last block. */
  to: number;
  severity: FieldSeverity;
  message: string;
}

/** The start position of each top-level block, and the document's size after the last. */
function blockStarts(doc: DocNode): number[] {
  const starts: number[] = [];
  doc.forEach((_node, offset) => starts.push(offset));
  starts.push(doc.content.size);
  return starts;
}

/** The markers whose first block is in `doc`, with their blocks clamped to it. */
export function placeMarkers(
  doc: DocNode,
  markers: readonly RichTextBlockMarker[],
): PlacedMarker[] {
  const starts = blockStarts(doc);
  const lastIndex = doc.childCount - 1;
  return markers.flatMap((marker) => {
    if (!Number.isInteger(marker.block) || marker.block < 0 || marker.block > lastIndex) return [];
    const end = Math.min(lastIndex, Math.max(marker.block, marker.endBlock ?? marker.block));
    return [
      {
        from: starts[marker.block] ?? 0,
        last: starts[end] ?? 0,
        to: starts[end + 1] ?? doc.content.size,
        severity: marker.severity ?? 'error',
        message: marker.message,
      },
    ];
  });
}

/**
 * Marks each block a marker covers with its severity (`data-severity`) and its messages as the
 * block's accessible description, so the finding is not told by colour alone. A block under
 * several markers takes the gravest severity and every message.
 */
export function decorateMarkers(doc: DocNode, placed: readonly PlacedMarker[]): DecorationSet {
  if (placed.length === 0) return DecorationSet.empty;
  const blocks = new Map<number, { end: number; severity: FieldSeverity; messages: string[] }>();
  for (const marker of placed) {
    doc.nodesBetween(marker.from, marker.to, (node, pos) => {
      const entry = blocks.get(pos) ?? {
        end: pos + node.nodeSize,
        severity: 'warning',
        messages: [],
      };
      if (marker.severity === 'error') entry.severity = 'error';
      entry.messages.push(marker.message);
      blocks.set(pos, entry);
      return false;
    });
  }
  const decorations = [...blocks].map(([pos, { end, severity, messages }]) =>
    Decoration.node(pos, end, {
      'data-severity': severity,
      'aria-description': messages.join(' '),
    }),
  );
  return DecorationSet.create(doc, decorations);
}
