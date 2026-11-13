import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createWindowModel } from './transcript-window.js';

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
    model.measure(feed, keys);
    const initial = model.range(viewport, feed, keys);
    for (let pass = 0; pass < 8; pass += 1) {
      correction *= -1;
      expect(model.range(viewport, feed, keys)).toEqual(initial);
    }
    viewport.scrollTop = 3200;
    const moved = model.range(viewport, feed, keys);
    expect(Number(moved?.first.slice(4))).toBeGreaterThan(40);
    expect(Number(moved?.last.slice(4)) - Number(moved?.first.slice(4))).toBeLessThan(20);
  });
});
