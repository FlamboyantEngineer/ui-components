/**
 * The element's running animations and transitions, or none where the Web Animations API is
 * missing (older engines, and test environments such as jsdom).
 */
export function listAnimations(element: Element | null | undefined): Animation[] {
  return element && typeof element.getAnimations === 'function' ? element.getAnimations() : [];
}
