import { createHooks } from '../../core/hooks.js';

export const emptyStateHooks = createHooks(
  'empty-state',
  ['spinner', 'icon', 'header', 'media', 'title', 'description', 'content', 'actions'],
  {
    root: 'empty',
    header: 'empty-header',
    media: 'empty-icon',
    icon: 'empty-icon',
    title: 'empty-title',
    description: 'empty-description',
    content: 'empty-content',
    actions: 'empty-content',
  },
);
