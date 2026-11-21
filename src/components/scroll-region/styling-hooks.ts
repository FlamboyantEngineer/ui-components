import { createHooks } from '../../core/hooks.js';

/** The styling hooks of a scroll region, shared by the region and its overlay scrollbars. */
export const scrollRegionHooks = createHooks(
  'scroll-region',
  ['viewport', 'overview', 'track', 'thumb'],
  {
    root: 'scroll-area',
    viewport: 'scroll-area-viewport',
    track: 'scroll-area-scrollbar',
    thumb: 'scroll-area-thumb',
  },
);
