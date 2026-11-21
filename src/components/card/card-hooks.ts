// The card's hook classes, shared by the card, its header and its More disclosure.

import { createHooks } from '../../core/hooks.js';

export const cardHooks = createHooks(
  'card',
  [
    'media',
    'header',
    'leading',
    'heading',
    'title',
    'abbreviation',
    'action',
    'description',
    'meta',
    'actions',
    'toggle',
    'more',
    'summary',
    'body',
    'skeleton',
    'footer',
  ],
  {
    root: 'card',
    header: 'card-header',
    title: 'card-title',
    description: 'card-description',
    action: 'card-action',
    body: 'card-content',
    footer: 'card-footer',
  },
);
