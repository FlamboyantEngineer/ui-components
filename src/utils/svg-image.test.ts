import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawSvgImage, svgImageSize } from './svg-image.js';

const SVG = 'http://www.w3.org/2000/svg';

function drawing(width = '24', height = '32') {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  const rect = document.createElementNS(SVG, 'rect');
  rect.setAttribute('fill', 'currentColor');
  svg.append(rect);
  document.body.append(svg);
  return svg;
}

interface Painted {
  source: string;
  canvas: { width: number; height: number };
  calls: string[];
}

/** A browser's image decoding and canvas painting, which jsdom lacks, recorded. */
function installPainting(decodes = true): Painted {
  const painted: Painted = { source: '', canvas: { width: 0, height: 0 }, calls: [] };
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'img') {
      const image = create('img');
      Object.defineProperty(image, 'src', {
        set(value: string) {
          painted.source = value;
          queueMicrotask(() => image.dispatchEvent(new Event(decodes ? 'load' : 'error')));
        },
      });
      return image;
    }
    if (tag !== 'canvas') return create(tag);
    const canvas = painted.canvas as unknown as HTMLCanvasElement & Painted['canvas'];
    Object.assign(canvas, {
      getContext: () => ({
        set fillStyle(value: string) {
          painted.calls.push(`fill ${value}`);
        },
        fillRect: () => painted.calls.push('fillRect'),
        drawImage: (_: unknown, x: number, y: number, w: number, h: number) =>
          painted.calls.push(`draw ${String([x, y, w, h])}`),
      }),
      toBlob: (done: (blob: Blob) => void) => done(new Blob(['png'], { type: 'image/png' })),
    });
    return canvas;
  });
  return painted;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('drawSvgImage', () => {
  it('UIC-CLIPBOARD-1.8 draws the element alone at its size times the scale, in the given ink', async () => {
    const painted = installPainting();
    const svg = drawing();
    const png = await drawSvgImage(svg, { scale: 3, color: '#000000', background: 'white' });
    await expect(png.text()).resolves.toBe('png');
    expect(painted.calls).toEqual(['fill white', 'fillRect', 'draw 0,0,72,96']);
    const markup = decodeURIComponent(painted.source.slice(painted.source.indexOf(',') + 1));
    expect(markup).toBe(
      `<svg xmlns="${SVG}" width="24" height="32" style="color: #000000"><rect fill="currentColor"/></svg>`,
    );
    expect(painted.canvas.width).toBe(0);
    expect(svg).not.toHaveAttribute('style');
  });

  it('UIC-CLIPBOARD-1.8 takes a given size and rejects a drawing without one or that fails', async () => {
    installPainting(false);
    expect(svgImageSize(drawing(), { width: 10 })).toEqual({ width: 10, height: 32 });
    await expect(drawSvgImage(drawing('0', '0'))).rejects.toThrow('no size');
    await expect(drawSvgImage(drawing())).rejects.toThrow('could not be decoded');
  });
});
