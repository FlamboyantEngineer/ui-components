import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SvgMarkup } from './svg-markup.js';
import type * as SvgReferencesModule from './svg-references.js';
import { createSvgReferenceScope } from './svg-references.js';

vi.mock('./svg-references.js', async (importOriginal) => {
  const original = await importOriginal<typeof SvgReferencesModule>();
  return { ...original, createSvgReferenceScope: vi.fn(original.createSvgReferenceScope) };
});

const leaf =
  '<svg viewBox="0 0 10 10"><defs><linearGradient id="tone"/></defs><circle r="4" fill="url(#tone)"/></svg>';

describe('SvgMarkup memoisation', () => {
  it('UIC-SVG-MARKUP-2.1 scopes a drawing again only when its markup changes', () => {
    const scope = vi.mocked(createSvgReferenceScope);
    scope.mockClear();
    const { container, rerender } = render(<SvgMarkup markup={leaf} label="Leaf" />);
    const circle = container.querySelector('circle');
    rerender(<SvgMarkup markup={leaf} label="Green leaf" className="large" />);
    expect(screen.getByRole('img', { name: 'Green leaf' })).toHaveClass('large');
    expect(container.querySelector('circle')).toBe(circle);
    expect(scope).toHaveBeenCalledTimes(1);
    rerender(<SvgMarkup markup={leaf.replace('r="4"', 'r="3"')} label="Green leaf" />);
    expect(container.querySelector('circle')).toHaveAttribute('r', '3');
    expect(scope).toHaveBeenCalledTimes(2);
  });

  it('UIC-SVG-MARKUP-2.4 renders nothing for markup without a drawing, on every render', () => {
    const { container, rerender } = render(<SvgMarkup markup="<div>Missing</div>" />);
    rerender(<SvgMarkup markup="<div>Missing</div>" label="Missing" />);
    expect(container).toBeEmptyDOMElement();
  });
});
