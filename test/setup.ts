import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no Web Animations; React Aria's selection indicators read running animations. Test
// files that run in Node have no `Element` at all.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = () => [];
}

afterEach(() => {
  cleanup();
});
