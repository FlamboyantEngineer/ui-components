import type { ReactNode } from 'react';

/** Whether a node renders nothing on its own: `null`, `undefined`, a boolean or the empty string. */
export function isEmptyNode(node: ReactNode): node is null | undefined | boolean | '' {
  return node === null || node === undefined || typeof node === 'boolean' || node === '';
}
