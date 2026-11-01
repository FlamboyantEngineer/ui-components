import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FallbackImage } from './fallback-image.js';

function image(container: HTMLElement) {
  return container.querySelector('img');
}

describe('FallbackImage', () => {
  it('UIC-FILE-UPLOAD-3.5 UIC-MEDIA-VIEWER-1.3 draws the fallback once its src fails', () => {
    const { container } = render(
      <FallbackImage src="/broken.png" alt="" loading="lazy" decoding="async" fallback="glyph" />,
    );
    const img = image(container);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    fireEvent.error(img as HTMLImageElement);
    expect(image(container)).toBeNull();
    expect(screen.getByText('glyph')).toBeInTheDocument();
  });

  it('UIC-REACTION-BAR-1.1 UIC-EMOJI-PICKER-1.3 loads a new src after a failed one', () => {
    const { container, rerender } = render(<FallbackImage src="/a.png" alt="" fallback="text" />);
    fireEvent.error(image(container) as HTMLImageElement);
    expect(image(container)).toBeNull();
    rerender(<FallbackImage src="/b.png" alt="" fallback="text" />);
    expect(image(container)).toHaveAttribute('src', '/b.png');
    expect(screen.queryByText('text')).not.toBeInTheDocument();
  });

  it('UIC-FILE-UPLOAD-3.5 ignores a failure reported by the previous src after a change', () => {
    const { container, rerender } = render(<FallbackImage src="/a.png" alt="" fallback="text" />);
    const previous = image(container) as HTMLImageElement;
    rerender(<FallbackImage src="/b.png" alt="" fallback="text" />);
    const current = image(container);
    expect(current).not.toBe(previous);
    fireEvent.error(previous);
    expect(image(container)).toBe(current);
    expect(current).toHaveAttribute('src', '/b.png');
  });

  it('UIC-MEDIA-VIEWER-1.3 settles an image that failed before its handler was attached', async () => {
    const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    try {
      const { container } = render(<FallbackImage src="/early.png" alt="" fallback="text" />);
      expect(await screen.findByText('text')).toBeInTheDocument();
      expect(image(container)).toBeNull();
    } finally {
      if (complete) Object.defineProperty(HTMLImageElement.prototype, 'complete', complete);
      else Reflect.deleteProperty(HTMLImageElement.prototype, 'complete');
    }
  });
});
