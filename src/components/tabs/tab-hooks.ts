import { createHooks } from '../../core/hooks.js';

/** The hooks of the tabs family, shared by its modules. */
export const tabsHooks = createHooks('tabs', [
  'bar',
  'list',
  'owner',
  'action',
  'scroll-button',
  'fade',
  'overflow',
  'add',
  'tab',
  'indicator',
  'icon',
  'label',
  'count',
  'remove',
  'rename',
  'rename-input',
  'rename-error',
  'panel',
]);
