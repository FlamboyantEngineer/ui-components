import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the progress-bar family writes (specs/PROGRESS-BAR.md). */
export const progressBarHooks = createHooks('progress-bar', [
  'ring',
  'track',
  'fill',
  'label',
  'value',
  'segment',
]);
