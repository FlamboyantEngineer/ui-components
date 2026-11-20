import { createHooks } from '../../core/hooks.js';

export const emptyStateHooks = createHooks('empty-state', [
  'spinner',
  'icon',
  'header',
  'media',
  'title',
  'description',
  'content',
  'actions',
]);
