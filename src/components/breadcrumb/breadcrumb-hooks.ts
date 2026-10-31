import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the breadcrumb family writes (specs/BREADCRUMB.md). */
export const breadcrumbHooks = createHooks('breadcrumb', [
  'list',
  'item',
  'link',
  'label',
  'menu',
  'separator',
  'overflow',
]);
