import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest runs without globals
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, vi } from 'vitest';

// Test files share their worker's jsdom and React (`isolate: false` in vitest.config.ts). Each file
// still evaluates the library and React Aria afresh, so module mocks and module state, such as
// React Aria's live announcer and tooltip warm-up, stay within the file.
vi.resetModules();

// jsdom has no Web Animations; React Aria's selection indicators read running animations. Test
// files that run in Node have no `Element` at all.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = () => [];
}

// Vitest runs without globals, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup();
});

// Hands the next file a clean document: no live regions, leftover portals, document attributes,
// stored values or fake clock from this one.
afterAll(() => {
  vi.useRealTimers();
  if (typeof document === 'undefined') return;
  document.body.replaceChildren();
  document.head.replaceChildren();
  for (const element of [document.documentElement, document.body]) {
    for (const name of element.getAttributeNames()) element.removeAttribute(name);
  }
  localStorage.clear();
  sessionStorage.clear();
});

// Testing Library settles each call on a zero timeout and, when it finds fake timers, advances that
// timeout through a global `jest`. Vitest's clock stands in for it so user-event runs on a fake
// clock (docs/TESTING-GUIDELINES.md). With real timers Testing Library never calls it.
Object.defineProperty(globalThis, 'jest', {
  configurable: true,
  value: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) },
});
