import { vi } from 'vitest';

/** Every element is ten pixels per character of text; a row's room comes from `data-room`. */
export function stubTextLayout(): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const width = (this.textContent ?? '').length * 10;
    return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 } as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return Number(this.dataset.room ?? 0);
  });
}
