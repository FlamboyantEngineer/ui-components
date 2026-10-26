// How a file field's value differs from its committed value, and how one removed file goes back.

import type { Key } from '../../core/props.js';

/** A file a file field holds: a reference to a file the owner has stored, not its bytes. */
export interface FileFieldItem {
  /** Unique among the field's files. */
  id: Key;
  name: string;
  /** In bytes. */
  size?: number | undefined;
  /** The MIME type, which picks the file's glyph. */
  type?: string | undefined;
  /** A thumbnail of the file. */
  previewUrl?: string | undefined;
  /** Where the file downloads from; the file then offers a download link. */
  downloadUrl?: string | undefined;
}

/** The files an edit added to the committed files, and the committed files it removed. */
interface FileFieldChanges {
  added: ReadonlySet<Key>;
  removed: readonly FileFieldItem[];
}

/** Compares the value with the committed value by file id. */
export function compareFileItems(
  value: readonly FileFieldItem[],
  committed: readonly FileFieldItem[],
): FileFieldChanges {
  const held = new Set(value.map(({ id }) => id));
  const kept = new Set(committed.map(({ id }) => id));
  return {
    added: new Set([...held].filter((id) => !kept.has(id))),
    removed: committed.filter(({ id }) => !held.has(id)),
  };
}

/**
 * The value with a removed committed file put back before the first file that follows it in the
 * committed order, or at the end.
 */
export function restoreFileItem(
  value: readonly FileFieldItem[],
  committed: readonly FileFieldItem[],
  item: FileFieldItem,
): FileFieldItem[] {
  const order = new Map(committed.map(({ id }, index) => [id, index]));
  const position = order.get(item.id) ?? committed.length;
  const at = value.findIndex(({ id }) => (order.get(id) ?? Infinity) > position);
  const next = [...value];
  next.splice(at === -1 ? next.length : at, 0, item);
  return next;
}
