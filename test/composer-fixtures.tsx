import { act } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Fakes the resize observations behind a composer's compact row: `resize` gives the composer's row
 * a width and a content width, then reports the resize as the browser would.
 */
export function installComposerRow() {
  const callbacks: Array<(entries: ResizeObserverEntry[]) => void> = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: (entries: ResizeObserverEntry[]) => void) {
        callbacks.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const resize = (container: HTMLElement, width: number, contentWidth: number) => {
    const row = container.querySelector('.ui-message-composer__footer');
    if (!row) throw new Error('no composer row');
    Object.defineProperty(row, 'clientWidth', { configurable: true, value: width });
    Object.defineProperty(row, 'scrollWidth', {
      configurable: true,
      value: Math.max(width, contentWidth),
    });
    // Other observers in the composer see no entries and keep their sizes.
    act(() => callbacks.forEach((callback) => callback([])));
  };
  return { resize };
}
