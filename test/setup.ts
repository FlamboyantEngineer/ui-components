import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest runs without globals
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no Web Animations; React Aria's selection indicators read running animations. Test
// files that run in Node have no `Element` at all.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = () => [];
}

// Vitest runs without globals, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
});
