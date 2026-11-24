import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TranscriptOrder } from './transcript-heights.js';
import { createWindowModel } from './transcript-window.js';

function createOrder(keys: readonly string[]): TranscriptOrder {
  return { keys, indexOf: new Map(keys.map((key, index) => [key, index])) };
}

describe('Measured virtual window boundaries', () => {
  it('UIC-CHAT-TRANSCRIPT-1.6 retains a boundary row across fractional measurement changes and releases it after scrolling away', () => {
    const keys = Array.from({ length: 100 }, (_, index) => `row-${index}`);
    render(
      <div role="region" aria-label="Viewport">
        <div role="feed">
          {keys.map((key) => (
            <article key={key}>{key}</article>
          ))}
        </div>
      </div>,
    );
    const viewport = screen.getByRole('region', { name: 'Viewport' });
    const feed = screen.getByRole('feed');
    Object.defineProperty(viewport, 'clientHeight', { value: 200 });
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 200));
    for (const article of screen.getAllByRole('article'))
      vi.spyOn(article, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 64));
    let correction = 0.25;
    vi.spyOn(feed, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, -viewport.scrollTop + correction, 600, 6400),
    );
    viewport.scrollTop = 648;
    const model = createWindowModel();
    const order = createOrder(keys);
    model.measure(feed, keys);
    const initial = model.range(viewport, feed, order);
    for (let pass = 0; pass < 8; pass += 1) {
      correction *= -1;
      expect(model.range(viewport, feed, order)).toEqual(initial);
    }
    viewport.scrollTop = 3200;
    const moved = model.range(viewport, feed, order);
    expect(Number(moved?.first.slice(4))).toBeGreaterThan(40);
    expect(Number(moved?.last.slice(4)) - Number(moved?.first.slice(4))).toBeLessThan(20);
  });

  it.each([5000, 50_000])(
    'UIC-CHAT-TRANSCRIPT-1.6 reads only a few keys to move the window and size spacers in a %i-message history',
    (size) => {
      render(
        <div role="region" aria-label="Viewport">
          <div role="feed" style={{ rowGap: 3 }}>
            <article>First</article>
            <article>Last</article>
          </div>
        </div>,
      );
      const viewport = screen.getByRole('region', { name: 'Viewport' });
      const feed = screen.getByRole('feed');
      const [first, last] = screen.getAllByRole('article');
      if (!first || !last) throw new Error('The measured articles must render.');
      Object.defineProperty(viewport, 'clientHeight', { value: 200 });
      vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 200));
      vi.spyOn(feed, 'getBoundingClientRect').mockImplementation(
        () => new DOMRect(0, -viewport.scrollTop, 600, 67 * size),
      );
      vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 600, 48));
      const lastBox = vi
        .spyOn(last, 'getBoundingClientRect')
        .mockReturnValue(new DOMRect(0, 0, 600, 80));
      const model = createWindowModel();
      const mounted = ['row-0', `row-${size - 1}`];
      model.measure(feed, mounted);
      const keys = Array.from({ length: size }, (_, index) => `row-${index}`);
      const readKey = vi.fn();
      const watched = new Proxy(keys, {
        get(target, name, receiver) {
          if (typeof name === 'string' && /^\d+$/.test(name)) readKey();
          return Reflect.get(target, name, receiver);
        },
      });
      const order = { ...createOrder(keys), keys: watched };
      model.gapHeight(order, 0, size);

      const middle = size / 2;
      viewport.scrollTop = middle * 67 - 16 + 200;
      expect(model.range(viewport, feed, order)).toEqual({
        first: `row-${middle}`,
        last: `row-${middle + 8}`,
      });
      expect(model.gapHeight(order, 1, middle)).toBe((middle - 1) * 67 - 3);
      expect(model.gapHeight(order, middle + 9, size)).toBe((size - middle - 9) * 67 + 13);

      // A changed measurement adjusts every estimate without rereading the ordered keys.
      lastBox.mockReturnValue(new DOMRect(0, 0, 600, 100));
      model.measure(feed, mounted);
      const threeQuarters = (size * 3) / 4;
      viewport.scrollTop = threeQuarters * 77 - 26 + 200;
      expect(model.range(viewport, feed, order)).toEqual({
        first: `row-${threeQuarters - 2}`,
        last: `row-${threeQuarters + 7}`,
      });
      expect(model.gapHeight(order, 1, threeQuarters)).toBe((threeQuarters - 1) * 77 - 3);
      expect(readKey.mock.calls.length).toBeLessThan(16);
    },
  );
});
