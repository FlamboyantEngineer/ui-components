import { createHooks } from '../../core/hooks.js';

export const scrollerHooks = createHooks('message-scroller', [
  'viewport',
  'content',
  'item',
  'button',
  'spacer',
]);
