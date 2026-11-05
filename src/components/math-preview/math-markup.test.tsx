import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderMathMarkup } from './math-markup.js';

const renderMarkup = (markup: string) => render(<span>{renderMathMarkup(markup)}</span>);

describe('renderMathMarkup', () => {
  it('UIC-MATH-PREVIEW-1.4 keeps MathML elements and presentation attributes', () => {
    const { container } = renderMarkup(
      '<span class="katex"><math display="block"><mfrac linethickness="2px"><mi mathvariant="bold">a</mi><mn>2</mn></mfrac></math></span>',
    );
    const math = container.querySelector('math');
    expect(math?.getAttribute('display')).toBe('block');
    expect(math?.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML');
    expect(container.querySelector('mfrac')?.getAttribute('linethickness')).toBe('2px');
    expect(container.querySelector('mi')?.getAttribute('mathvariant')).toBe('bold');
    expect(container.querySelector('.katex')).toBeNull();
    expect(container).toHaveTextContent('a2');
  });

  it('UIC-MATH-PREVIEW-1.4 drops links, styles, handlers, scripts and unknown elements', () => {
    const { container } = renderMarkup(
      '<math><mrow href="javascript:alert(1)" style="color:red" onclick="alert(1)" class="x" id="y"><mstyle mathcolor="url(#a)" mathbackground="#fff"><mi>y</mi></mstyle><mi>x</mi><mglyph src="a.png"></mglyph><script>alert(1)</script><img src="a.png" onerror="alert(1)"></mrow></math>',
    );
    const row = container.querySelector('mrow');
    expect(row?.getAttributeNames()).toEqual([]);
    expect(container.querySelector('mstyle')?.getAttributeNames()).toEqual(['mathbackground']);
    expect(container.querySelector('script, img, mglyph')).toBeNull();
    expect(container).toHaveTextContent('yx');
  });

  it('UIC-MATH-PREVIEW-1.4 renders nothing for markup without math', () => {
    expect(renderMathMarkup('<p>no math</p>')).toBeNull();
  });
});
