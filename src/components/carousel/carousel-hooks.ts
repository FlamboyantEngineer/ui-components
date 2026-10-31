import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the carousel family writes (specs/CAROUSEL.md). */
export const carouselHooks = createHooks('carousel', [
  'viewport',
  'slide',
  'controls',
  'rotation',
  'previous',
  'next',
  'pagination',
  'dot',
  'thumbnail',
]);
