import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the board writes (specs/BOARD.md). */
export const boardHooks = createHooks('board', [
  'columns',
  'column',
  'column-handle',
  'column-toggle',
  'column-title',
  'column-count',
  'lane',
  'lane-header',
  'lane-toggle',
  'lane-title',
  'lane-count',
  'cells',
  'cell',
  'cards',
  'card',
  'card-handle',
  'card-content',
  'drop-indicator',
  'empty',
  'add',
]);
