// The moves a file upload's reader makes to its listed files, as plain data.

import type { Key } from '../../core/props.js';

/** A move of one listed file beside another, by the files' ids. */
export interface FileUploadMove {
  /** The moved file. */
  id: Key;
  /** The file it lands beside. */
  targetId: Key;
  /** Which side of the target it lands on. */
  position: 'before' | 'after';
}

/**
 * The listed files after `move`: the moved file leaves its place and lands before or after the
 * target. A move onto itself, or of or onto a file not listed, returns the files unchanged.
 */
export function moveFileUploadItem<T extends { id: Key }>(
  files: readonly T[],
  { id, targetId, position }: FileUploadMove,
): T[] {
  const item = files.find((file) => file.id === id);
  const rest = files.filter((file) => file.id !== id);
  const target = rest.findIndex((file) => file.id === targetId);
  if (!item || id === targetId || target === -1) return [...files];
  return rest.toSpliced(position === 'before' ? target : target + 1, 0, item);
}
