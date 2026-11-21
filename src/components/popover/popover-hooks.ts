import { createHooks } from '../../core/hooks.js';

export const popoverHooks = createHooks(
  'popover',
  ['arrow', 'dialog', 'header', 'title', 'description', 'close', 'body'],
  {
    root: 'popover-content',
    header: 'popover-header',
    title: 'popover-title',
    description: 'popover-description',
  },
);
