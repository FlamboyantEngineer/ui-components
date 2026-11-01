import type { DocumentBlock } from './compare-blocks.js';
import { isShallowEqual } from './is-shallow-equal.js';
import { requireDefined } from './require-defined.js';

/** Whether two blocks hold the same fields, their marks compared one by one. */
function isSameBlock(left: DocumentBlock, right: DocumentBlock): boolean {
  if (left === right) return true;
  const { marks: leftMarks = [], ...leftFields } = left;
  const { marks: rightMarks = [], ...rightFields } = right;
  return (
    isShallowEqual(leftFields, rightFields) &&
    leftMarks.length === rightMarks.length &&
    leftMarks.every((mark, index) => isShallowEqual(mark, rightMarks[index]))
  );
}

/**
 * Whether two documents hold the same blocks in order, as a parent that rebuilds its arrays on
 * each render passes them: each block's fields and marks are compared, nothing deeper, so the
 * check costs no more than reading the documents.
 */
export function isSameDocument(
  left: readonly DocumentBlock[],
  right: readonly DocumentBlock[],
): boolean {
  return (
    left === right ||
    (left.length === right.length &&
      left.every((block, index) => isSameBlock(block, requireDefined(right[index]))))
  );
}
