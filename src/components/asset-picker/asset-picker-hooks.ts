import { createHooks } from '../../core/hooks.js';

/** The asset picker's hooks, shared by its results and its placement form. */
export const assetPickerHooks = createHooks('asset-picker', [
  'search',
  'results',
  'item',
  'thumbnail',
  'name',
  'details',
  'alt',
  'size',
  'constrain',
  'align',
  'actions',
]);
