import { createHooks } from '../../core/hooks.js';

/** The hooks of the thread's own parts, shared by its modules. */
export const commentThreadHooks = createHooks('comment-thread', [
  'header',
  'author',
  'quote',
  'status',
  'resolve',
  'header-actions',
  'menu',
  'close',
  'comments',
  'item',
  'more',
  'show-more',
  'activity',
  'activity-item',
  'activity-label',
  'activity-cancel',
  'activity-retry',
  'activity-status',
  'error',
  'composer',
]);
