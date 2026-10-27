import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { encodeQr } from '../../utils/encode-qr.js';
import { QrCode } from './qr-code.js';

function svg(container: HTMLElement): SVGSVGElement {
  return container.querySelector('svg') as SVGSVGElement;
}

/** The dark cells a path of `M x y h w v1 h-w z` runs covers, as `x,y` keys. */
function paintedCells(path: string): Set<string> {
  const cells = new Set<string>();
  for (const [, x, y, width] of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    for (let step = 0; step < Number(width); step += 1) {
      cells.add(`${Number(x) + step},${y}`);
    }
  }
  return cells;
}

describe('QrCode', () => {
  it('UIC-QR-CODE-2.1 draws the dark modules as one path inside the quiet zone', () => {
    const { container } = render(<QrCode value="hello" />);
    const root = svg(container);
    expect(root).toHaveAttribute('viewBox', '0 0 29 29');
    expect(root).toHaveAttribute('width', '116');
    expect(root).toHaveAttribute('height', '116');
    expect(root).toHaveAttribute('shape-rendering', 'crispEdges');
    const path = container.querySelector('.ui-qr-code__modules') as SVGPathElement;
    const symbol = encodeQr('hello');
    const expected = new Set<string>();
    symbol?.modules.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) expected.add(`${x + 4},${y + 4}`);
      }),
    );
    expect(paintedCells(path.getAttribute('d') ?? '')).toEqual(expected);
    expectHooksMatchSpec(container, 'QR-CODE', { slots: ['modules'] });
  });

  it('UIC-QR-CODE-2.1 takes a quiet zone and a module size, ignoring invalid ones', () => {
    const { container, rerender } = render(
      <QrCode value="hello" quietZone={1.8} moduleSize={2.5} />,
    );
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 23 23');
    expect(svg(container)).toHaveAttribute('width', '57.5');
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M1 1h7/);
    rerender(<QrCode value="hello" quietZone={0} />);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 21 21');
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M0 0h7/);
    rerender(<QrCode value="hello" quietZone={-2} moduleSize={0} />);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 29 29');
    expect(svg(container)).toHaveAttribute('width', '116');
  });

  it('UIC-QR-CODE-2.2 chooses the error correction level and publishes the version', () => {
    const { container, rerender } = render(<QrCode value={'x'.repeat(100)} />);
    expect(svg(container)).toHaveAttribute('data-error-correction', 'medium');
    expect(svg(container)).toHaveAttribute('data-version', '6');
    rerender(<QrCode value={'x'.repeat(100)} errorCorrection="high" />);
    expect(svg(container)).toHaveAttribute('data-error-correction', 'high');
    expect(svg(container)).toHaveAttribute('data-version', '10');
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 65 65');
    expectHooksMatchSpec(container, 'QR-CODE');
  });

  it('UIC-QR-CODE-2.3 draws nothing and says so for text too long', () => {
    const { container } = render(<QrCode value={'k'.repeat(1300)} errorCorrection="high" />);
    expect(svg(container)).toHaveAttribute('data-invalid', 'true');
    expect(svg(container)).not.toHaveAttribute('data-version');
    expect(container.querySelector('path')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName('The text is too long for a QR code.');
    expectHooksMatchSpec(container, 'QR-CODE');
  });

  it('UIC-QR-CODE-3.1 is an image named by the caller or by the text it holds', () => {
    const { rerender } = render(<QrCode value="https://example.com" />);
    const image = screen.getByRole('img');
    expect(image).toHaveAccessibleName('QR code: https://example.com');
    expect(image).toHaveAttribute('focusable', 'false');
    rerender(<QrCode value="https://example.com" aria-label="Scan to open the menu" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Scan to open the menu');
    rerender(
      <>
        <span id="caption">Wi-Fi details</span>
        <QrCode value="WIFI:S:Guest;;" aria-labelledby="caption" />
      </>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('Wi-Fi details');
    rerender(
      <UiProvider messages={{ qrCodeOf: 'Code QR : {value}' }}>
        <QrCode value="abc" />
      </UiProvider>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('Code QR : abc');
  });

  it('UIC-QR-CODE-3.2 forwards the class name, caller attributes, id and ref', () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(
      <QrCode value="hello" className="ticket" id="code" data-kind="entry" ref={ref} />,
    );
    const root = svg(container);
    expect(root).toHaveClass('ui-qr-code', 'ticket');
    expect(root).toHaveAttribute('id', 'code');
    expect(root).toHaveAttribute('data-kind', 'entry');
    expect(ref.current).toBe(root);
    expectHooksMatchSpec(container, 'QR-CODE', { callerAttributes: ['data-kind'] });
  });
});
