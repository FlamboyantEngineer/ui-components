import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseSvgMarkup } from './parse-svg-markup.js';
import { SvgMarkup } from './svg-markup.js';

const tokens =
  '<svg><g style="--Leaf: #16a34a; --leaf: red; --LEAF-shade: var(--Leaf)"><rect width="4" height="4" style="fill: var(--LEAF-shade, red); STROKE: var(--Missing, #16a34a)"/></g></svg>';

describe('SVG custom properties', () => {
  it('UIC-SVG-MARKUP-1.2 keeps custom property names as written and lower-cases the others', () => {
    const [group] = parseSvgMarkup(tokens).children;
    if (group?.type !== 'element') throw new Error('expected the group');
    expect(group.attributes.style).toBe('--Leaf: #16a34a; --leaf: red; --LEAF-shade: var(--Leaf)');
    const [rect] = group.children;
    if (rect?.type !== 'element') throw new Error('expected the rect');
    expect(rect.attributes.style).toBe(
      'fill: var(--LEAF-shade, red); stroke: var(--Missing, #16a34a)',
    );
    // The value checks still apply whatever the name's case.
    const [unsafe] = parseSvgMarkup(
      '<svg><rect style="--Remote: url(https://remote.invalid/a.svg#p); --Local: url(#p)"/></svg>',
    ).children;
    expect(unsafe?.type === 'element' && unsafe.attributes.style).toBe('--Local: url(#p)');
  });

  it('UIC-SVG-MARKUP-2.1 renders distinct custom properties per case, in the DOM and on the server', () => {
    const { container } = render(<SvgMarkup markup={tokens} />);
    const group = container.querySelector('g') as SVGGElement;
    expect(group.style.getPropertyValue('--Leaf')).toBe('#16a34a');
    expect(group.style.getPropertyValue('--leaf')).toBe('red');
    expect(group.style.getPropertyValue('--LEAF-shade')).toBe('var(--Leaf)');
    expect((container.querySelector('rect') as SVGRectElement).style.fill).toBe(
      'var(--LEAF-shade, red)',
    );
    expect(renderToStaticMarkup(<SvgMarkup markup={tokens} />)).toContain(
      'style="--Leaf:#16a34a;--leaf:red;--LEAF-shade:var(--Leaf)"',
    );
  });
});
