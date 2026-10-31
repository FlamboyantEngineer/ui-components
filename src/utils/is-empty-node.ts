import type { ReactNode } from 'react';

interface EmptyNodeOptions {
  /** Also counts a string of only whitespace as empty, for text that would render blank. */
  isBlankEmpty: boolean;
}

/**
 * Whether a node renders nothing on its own: `null`, `undefined`, a boolean or the empty string,
 * and with `isBlankEmpty` a string of only whitespace too.
 */
export function isEmptyNode(node: ReactNode): node is null | undefined | boolean | '';
export function isEmptyNode(node: ReactNode, options: EmptyNodeOptions): boolean;
export function isEmptyNode(node: ReactNode, options?: EmptyNodeOptions): boolean {
  if (node === null || node === undefined || typeof node === 'boolean' || node === '') return true;
  return Boolean(options?.isBlankEmpty) && typeof node === 'string' && node.trim() === '';
}
