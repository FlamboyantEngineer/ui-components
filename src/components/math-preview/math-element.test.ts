import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMathElement as typesetElement } from './math-element.js';
import { sanitizeMathMarkup } from './math-sanitize.js';

const mathNamespace = 'http://www.w3.org/1998/Math/MathML';

describe('sanitizeMathMarkup', () => {
  it('UIC-MATH-PREVIEW-3.1 rebuilds the first math element through the allow-list', () => {
    const element = sanitizeMathMarkup(
      '<span class="katex"><math display="block"><mrow href="javascript:alert(1)" onclick="x()" style="color:red"><mstyle mathcolor="url(#a)" mathbackground="#fff"><mi mathvariant="bold">a</mi></mstyle><script>alert(1)</script><mn>2</mn><img src="a.png" onerror="alert(1)"></mrow></math><math><mi>b</mi></math></span>',
      document,
    );
    expect(element?.namespaceURI).toBe(mathNamespace);
    expect(element?.ownerDocument).toBe(document);
    expect(element?.isConnected).toBe(false);
    expect(element?.outerHTML).toBe(
      '<math display="block"><mrow><mstyle mathbackground="#fff"><mi mathvariant="bold">a</mi></mstyle><mn>2</mn></mrow></math>',
    );
  });

  it('UIC-MATH-PREVIEW-3.1 answers null for markup without math', () => {
    expect(sanitizeMathMarkup('<p>no math</p>', document)).toBeNull();
    expect(sanitizeMathMarkup('', document)).toBeNull();
  });
});

describe('renderMathElement', () => {
  afterEach(() => {
    vi.doUnmock('katex');
    vi.resetModules();
  });

  it('UIC-MATH-PREVIEW-3.2 typesets with KaTeX by default', async () => {
    const result = await typesetElement('\\frac{a}{b}', {
      displayMode: true,
      ownerDocument: document,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.element.attributes.getNamedItem('display')?.value).toBe('block');
    expect(result.element.querySelector('mfrac')?.namespaceURI).toBe(mathNamespace);
  });

  it('UIC-MATH-PREVIEW-3.2 answers the renderer message for invalid source', async () => {
    expect(
      await typesetElement('\\frac{1', { displayMode: false, ownerDocument: document }),
    ).toMatchObject({ ok: false, message: expect.any(String) as string });
  });

  it('UIC-MATH-PREVIEW-3.2 takes a renderer and never throws', async () => {
    const options = { displayMode: false, ownerDocument: document };
    const renderer = vi.fn(() => ({ ok: true as const, mathml: '<math><mi>x</mi></math>' }));
    const result = await typesetElement('x', { ...options, renderer });
    expect(renderer).toHaveBeenCalledWith('x', { displayMode: false });
    expect(result.ok && result.element.textContent).toBe('x');
    expect(
      await typesetElement('x', {
        ...options,
        renderer: () => Promise.reject(new Error('offline')),
      }),
    ).toEqual({ ok: false, message: 'offline' });
    expect(
      await typesetElement('x', { ...options, renderer: () => ({ ok: true, mathml: '<p>' }) }),
    ).toEqual({ ok: false, message: 'The renderer returned no MathML.' });
  });

  it('UIC-MATH-PREVIEW-3.2 fails gracefully when KaTeX is not installed', async () => {
    vi.resetModules();
    vi.doMock('katex', () => {
      throw new Error('Cannot find package katex');
    });
    const { renderMathElement: typesetWithoutKatex } = await import('./math-element.js');
    const result = await typesetWithoutKatex('x', { displayMode: false, ownerDocument: document });
    expect(result).toMatchObject({ ok: false, message: expect.any(String) as string });
  });
});
