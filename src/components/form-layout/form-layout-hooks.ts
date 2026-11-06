import { createHooks } from '../../core/hooks.js';

export const formLayoutHooks = createHooks('form-layout', ['node', 'title', 'children']);

export const formLayoutDesignerHooks = createHooks('form-layout-designer', [
  'palette',
  'palette-item',
  'canvas',
  'empty',
  'node',
  'header',
  'handle',
  'title',
  'remove',
  'body',
  'children',
  'slot',
  'inspector',
  'status',
]);
