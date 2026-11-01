import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the tree writes (specs/TREE.md). */
export const treeHooks = createHooks('tree', [
  'item',
  'drag-handle',
  'expand',
  'expand-spacer',
  'checkbox',
  'state-mark',
  'icon',
  'label',
  'new-mark',
  'rename-input',
  'meta',
  'load-error',
  'actions',
  'drop-indicator',
  'loader',
  'empty',
]);
