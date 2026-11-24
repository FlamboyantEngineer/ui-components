import { afterEach, describe, expect, it, vi } from 'vitest';
import * as entry from './index.js';
import { copyMath, copyMathImage, mathMarkup } from './math-copy.js';
import { sanitizeMathMarkup } from './math-sanitize.js';

const MATHML = 'http://www.w3.org/1998/Math/MathML';

class Item {
  constructor(readonly values: Record<string, Blob | Promise<Blob>>) {}
}

function recorder() {
  const writes: Array<Record<string, Blob | Promise<Blob>>> = [];
  const clipboard = {
    write: vi.fn(async (items: never[]) => {
      writes.push((items[0] as unknown as Item).values);
    }),
  };
  return { writes, clipboard };
}

const fraction = () =>
  sanitizeMathMarkup('<math display="block"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>', document);

afterEach(() => {
  document.body.replaceChildren();
});

describe('mathMarkup', () => {
  it('UIC-MATH-PREVIEW-4.1 answers namespaced MathML with the source as its TeX annotation', () => {
    const math = fraction();
    if (!math) throw new Error('no math');
    expect(mathMarkup(math, String.raw`\frac{a}{b}`)).toBe(
      `<math xmlns="${MATHML}" display="block"><semantics><mrow><mfrac><mi>a</mi><mi>b</mi></mfrac></mrow><annotation encoding="application/x-tex">\\frac{a}{b}</annotation></semantics></math>`,
    );
    expect(mathMarkup(math)).toBe(
      `<math xmlns="${MATHML}" display="block"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>`,
    );
  });

  it('UIC-MATH-PREVIEW-4.1 keeps a TeX annotation the math already carries', () => {
    const math = sanitizeMathMarkup(
      '<math><semantics><mi>x</mi><annotation encoding="application/x-tex">x</annotation></semantics></math>',
      document,
    );
    if (!math) throw new Error('no math');
    expect(mathMarkup(math, 'y')).toBe(
      `<math xmlns="${MATHML}"><semantics><mi>x</mi><annotation encoding="application/x-tex">x</annotation></semantics></math>`,
    );
  });
});

describe('copyMath', () => {
  it('UIC-MATH-PREVIEW-4.1 copies the markup as both HTML and plain text', async () => {
    const math = fraction();
    if (!math) throw new Error('no math');
    const { writes, clipboard } = recorder();
    await expect(copyMath(math, { source: 'a/b', clipboard, ClipboardItem: Item })).resolves.toBe(
      'rich',
    );
    const formats = writes[0] ?? {};
    const markup = mathMarkup(math, 'a/b');
    await expect((await formats['text/plain'])?.text()).resolves.toBe(markup);
    await expect((await formats['text/html'])?.text()).resolves.toBe(markup);
    expect(entry.copyMath).toBe(copyMath);
  });
});

describe('copyMathImage', () => {
  it('UIC-MATH-PREVIEW-4.2 copies the drawing in black with an HTML image at its size', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '30');
    svg.setAttribute('height', '20');
    svg.style.color = 'white';
    document.body.append(svg);
    let markup = '';
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = create(tag);
      if (tag === 'img')
        Object.defineProperty(element, 'src', {
          set(value: string) {
            markup = decodeURIComponent(value.slice(value.indexOf(',') + 1));
            queueMicrotask(() => element.dispatchEvent(new Event('load')));
          },
        });
      if (tag === 'canvas')
        Object.assign(element, {
          getContext: () => ({ drawImage: () => undefined }),
          toBlob: (done: (blob: Blob) => void) => done(new Blob(['png'], { type: 'image/png' })),
        });
      return element;
    });
    const { writes, clipboard } = recorder();
    await expect(copyMathImage(svg, { clipboard, ClipboardItem: Item, alt: 'a' })).resolves.toBe(
      true,
    );
    expect(markup).toContain('style="color: #000000"');
    const formats = writes[0] ?? {};
    await expect((await formats['text/html'])?.text()).resolves.toMatch(
      /^<img src="data:image\/png;base64,cG5n" width="30" height="20" alt="a">$/,
    );
  });
});
