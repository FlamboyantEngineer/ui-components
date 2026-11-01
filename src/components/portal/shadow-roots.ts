import { enableShadowDOM } from '../../primitives/index.js';

/**
 * Turns on support for rendering inside shadow roots, as web components hold the library: presses,
 * focus moves, focus containment and outside-press checks then follow events and focus across
 * shadow boundaries. Call it once, before rendering into a shadow root; it applies to the whole
 * page and cannot be turned off.
 */
export function enableShadowRoots(): void {
  enableShadowDOM();
}
