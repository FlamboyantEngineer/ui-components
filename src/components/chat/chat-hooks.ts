import { createHooks } from '../../core/hooks.js';

export const chatHooks = createHooks('chat', [
  'search-toggle',
  'search',
  'transcript',
  'status',
  'typing',
  'queue',
  'queue-label',
  'queue-list',
  'queue-item',
  'queue-text',
  'queue-attachments',
  'queue-steer',
  'queue-edit',
  'queue-remove',
  'queue-handle',
  'queue-menu',
  'compose',
  'progress',
  'progress-icon',
  'progress-label',
  'composer',
  'disclaimer',
  'banner',
  'banner-label',
  'banner-cancel',
]);

export const chatHeaderHooks = createHooks('chat-header', [
  'avatar',
  'text',
  'title',
  'status',
  'actions',
]);
