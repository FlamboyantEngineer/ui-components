import { describe, expect, it } from 'vitest';
import {
  formatSignatureDataUrl,
  formatSignatureStroke,
  formatSignatureSvg,
  type DrawnSignature,
} from './signature-path.js';

describe('signature paths', () => {
  it('UIC-SIGNATURE-PAD-2.2 smooths a stroke with curves through the midpoints', () => {
    expect(
      formatSignatureStroke([
        { x: 10, y: 10 },
        { x: 20, y: 30 },
        { x: 40, y: 30 },
        { x: 50, y: 10 },
      ]),
    ).toBe('M10 10 Q20 30 30 30 Q40 30 45 20 L50 10');
    expect(
      formatSignatureStroke([
        { x: 0, y: 0 },
        { x: 10.04, y: 5.06 },
      ]),
    ).toBe('M0 0 L10 5.1');
  });

  it('UIC-SIGNATURE-PAD-2.2 ends a short stroke at its last position and keeps a returning one a dot', () => {
    expect(
      formatSignatureStroke([
        { x: 0, y: 0 },
        { x: 0.5, y: 0.5 },
      ]),
    ).toBe('M0 0 L0.5 0.5');
    expect(
      formatSignatureStroke([
        { x: 0, y: 0 },
        { x: 0.4, y: 0.2 },
        { x: 0.8, y: 0.6 },
        { x: 1, y: 1 },
      ]),
    ).toBe('M0 0 L1 1');
    expect(
      formatSignatureStroke([
        { x: 3, y: 3 },
        { x: 3.5, y: 3.5 },
        { x: 3, y: 3 },
      ]),
    ).toBe('M3 3 L3 3');
    expect(
      formatSignatureStroke([
        { x: 3, y: 3 },
        { x: 3, y: 3 },
      ]),
    ).toBe('M3 3 L3 3');
    expect(
      formatSignatureStroke([
        { x: 0, y: 0 },
        { x: 0.04, y: 0 },
      ]),
    ).toBe('M0 0 L0 0');
  });

  it('UIC-SIGNATURE-PAD-2.2 drops positions too close together, keeps the last and draws a dot for one', () => {
    expect(formatSignatureStroke([])).toBe('');
    expect(formatSignatureStroke([{ x: 12.34, y: 56.78 }])).toBe('M12.3 56.8 L12.3 56.8');
    expect(
      formatSignatureStroke([
        { x: 0, y: 0 },
        { x: 0.5, y: 0.5 },
        { x: 10, y: 0 },
        { x: 10.4, y: 0.4 },
      ]),
    ).toBe('M0 0 L10.4 0.4');
    expect(
      formatSignatureStroke([
        { x: 5, y: 5 },
        { x: 5.2, y: 5.2 },
      ]),
    ).toBe('M5 5 L5.2 5.2');
  });

  it('UIC-SIGNATURE-PAD-2.4 writes standalone SVG markup and a data URL, escaping path data', () => {
    const drawing: DrawnSignature = {
      kind: 'drawn',
      width: 600,
      height: 200,
      paths: ['M10 10 L50 10', 'M0 0 L1 1"/><script>alert(1)</script><path d="'],
    };
    const svg = formatSignatureSvg(drawing);
    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200" ' +
        'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" ' +
        'stroke-linejoin="round"><path d="M10 10 L50 10"/>' +
        '<path d="M0 0 L1 1&quot;/>&lt;script>alert(1)&lt;/script>&lt;path d=&quot;"/></svg>',
    );
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(parsed.querySelectorAll('path')).toHaveLength(2);
    expect(parsed.querySelector('script')).toBeNull();
    const url = formatSignatureDataUrl(drawing);
    expect(url.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(url.slice('data:image/svg+xml,'.length))).toBe(svg);
  });
});
