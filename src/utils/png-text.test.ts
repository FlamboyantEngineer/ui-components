import { describe, expect, it } from 'vitest';
import { readPngText, withPngText } from './png-text.js';

// A 1x1 transparent PNG.
const PIXEL =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const pixel = () =>
  new Blob([Uint8Array.from(atob(PIXEL), (char) => char.charCodeAt(0))], { type: 'image/png' });

describe('PNG text', () => {
  it('UIC-CLIPBOARD-1.9 writes text chunks after the header and reads them back', async () => {
    const source = String.raw`\int_0^1 x^2 \, dx = \tfrac{1}{3} → ∞`;
    const png = await withPngText(pixel(), { LaTeX: source, 'LaTeX display': 'display' });
    expect(png.type).toBe('image/png');
    const bytes = new Uint8Array(await png.arrayBuffer());
    expect(new TextDecoder('latin1').decode(bytes.subarray(37, 41))).toBe('iTXt');
    await expect(readPngText(png)).resolves.toEqual({ LaTeX: source, 'LaTeX display': 'display' });
    await expect(readPngText(pixel())).resolves.toEqual({});
  });

  it('UIC-CLIPBOARD-1.9 leaves a blob that is not a PNG, and keywords it cannot hold, alone', async () => {
    const text = new Blob(['not an image'], { type: 'text/plain' });
    await expect(withPngText(text, { LaTeX: 'x' })).resolves.toBe(text);
    await expect(readPngText(text)).resolves.toEqual({});
    const png = await withPngText(pixel(), { '': 'x', é: 'y', [`${'k'.repeat(80)}`]: 'z' });
    expect(png.size).toBe(pixel().size);
  });
});
