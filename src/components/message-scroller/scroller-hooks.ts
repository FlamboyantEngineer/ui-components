import { createHooks } from '../../core/hooks.js';

export const scrollerHooks = createHooks(
  'message-scroller',
  ['viewport', 'content', 'item', 'button', 'spacer'],
  {
    root: 'message-scroller',
    viewport: 'message-scroller-viewport',
    content: 'message-scroller-content',
    item: 'message-scroller-item',
    button: 'message-scroller-button',
  },
);
