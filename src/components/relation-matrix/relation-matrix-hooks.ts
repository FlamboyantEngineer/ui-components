import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the relation matrix writes (specs/RELATION-MATRIX.md). */
export const relationMatrixHooks = createHooks('relation-matrix', [
  'header',
  'corner',
  'column',
  'column-label',
  'column-count',
  'body',
  'row',
  'row-header',
  'row-label',
  'row-count',
  'cell',
  'mark',
]);
