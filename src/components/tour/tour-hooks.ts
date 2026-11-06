import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the tour family writes (specs/TOUR.md). */
export const tourHooks = createHooks('tour', [
  'dialog',
  'header',
  'title',
  'progress',
  'body',
  'status',
  'retry',
  'footer',
  'skip',
  'back',
  'next',
  'arrow',
  'spotlight',
]);
