import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the tree writes (specs/TREE.md). */
export const treeHooks = createHooks('tree', [
  'item',
  'drag-handle',
  'expand',
  'expand-spacer',
  'icon',
  'label',
  'meta',
  'actions',
  'drop-indicator',
  'loader',
  'empty',
]);
