import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the segmented-bar family writes (specs/SEGMENTED-BAR.md). */
export const segmentedBarHooks = createHooks('segmented-bar', [
  'track',
  'segment',
  'label',
  'total',
  'legend',
  'item',
  'swatch',
  'item-label',
  'item-value',
  'item-share',
  'ring',
]);
