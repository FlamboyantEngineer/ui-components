import { createHooks } from '../../core/hooks.js';

/** The hooks of the tabs family, shared by its modules. */
export const tabsHooks = createHooks('tabs', [
  'bar',
  'list',
  'scroll-button',
  'overflow',
  'add',
  'tab',
  'indicator',
  'icon',
  'label',
  'count',
  'remove',
  'panel',
]);
