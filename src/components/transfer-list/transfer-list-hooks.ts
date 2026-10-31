import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the transfer-list family writes (specs/TRANSFER-LIST.md). */
export const transferListHooks = createHooks('transfer-list', [
  'pane',
  'header',
  'title',
  'count',
  'search',
  'list',
  'empty',
  'actions',
  'move',
  'reorder',
]);
