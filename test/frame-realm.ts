// A same-origin frame's globals, for values made by another window's constructors (a `Date`, a
// `URL`), as a host rendering into a frame or popup passes them.

import { onTestFinished } from 'vitest';

/** The globals of a new same-origin frame, removed when the test finishes. */
export function createFrameRealm(): Window & typeof globalThis {
  const frame = document.body.appendChild(document.createElement('iframe'));
  onTestFinished(() => frame.remove());
  return frame.contentWindow as Window & typeof globalThis;
}
