import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Barcode } from './barcode.js';
import { encodeBarcode } from './encode-barcode.js';

function svg(container: HTMLElement): SVGSVGElement {
  return container.querySelector('svg') as SVGSVGElement;
}

/** The modules a path of `M x 0 h w v1 h-w z` bars covers, as indices across. */
function paintedModules(path: string): number[] {
  const modules: number[] = [];
  for (const [, x, width] of path.matchAll(/M(\d+) 0h(\d+)v1h-\d+z/g)) {
    for (let step = 0; step < Number(width); step += 1) modules.push(Number(x) + step);
  }
  return modules;
}

describe('Barcode', () => {
  it('UIC-BARCODE-2.1 draws the bars as one path between the quiet zones', () => {
    const { container } = render(<Barcode value="4006381333931" format="ean13" />);
    const symbol = svg(container);
    // 11 + 95 + 7 modules across, 2 pixels each.
    expect(symbol).toHaveAttribute('viewBox', '0 0 113 1');
    expect(symbol).toHaveAttribute('width', '226');
    expect(symbol).toHaveAttribute('height', '64');
    expect(symbol).toHaveAttribute('preserveAspectRatio', 'none');
    expect(symbol).toHaveAttribute('shape-rendering', 'crispEdges');
    const modules = encodeBarcode('4006381333931', 'ean13').symbol?.modules ?? [];
    const expected = modules.flatMap((dark, index) => (dark ? [index + 11] : []));
    const path = container.querySelector('.ui-barcode__bars')?.getAttribute('d') ?? '';
    expect(paintedModules(path)).toEqual(expected);
    expectHooksMatchSpec(container, 'BARCODE', { slots: ['symbol', 'bars'] });
  });

  it('UIC-BARCODE-2.1 widens the quiet zones and sizes whole modules, ignoring invalid sizes', () => {
    const { container, rerender } = render(
      <Barcode value="ABC" quietZone={12.7} moduleWidth={3.6} height={40} />,
    );
    // Start, three characters, check: 5 × 11 + 13 = 68 modules, then 12 on each side.
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 92 1');
    expect(svg(container)).toHaveAttribute('width', '276');
    expect(svg(container)).toHaveAttribute('height', '40');
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M12 0h2/);
    rerender(<Barcode value="ABC" quietZone={2} moduleWidth={0.5} height={-1} />);
    expect(svg(container)).toHaveAttribute('viewBox', '0 0 88 1');
    expect(svg(container)).toHaveAttribute('width', '176');
    expect(svg(container)).toHaveAttribute('height', '64');
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M10 0h2/);
  });

  it('UIC-BARCODE-2.2 UIC-BARCODE-2.3 publishes the format and shows the value on request', () => {
    const { container, rerender } = render(<Barcode value="03600029145" format="upca" />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-format', 'upca');
    expect(container.querySelector('.ui-barcode__value')).toBeNull();
    rerender(<Barcode value="03600029145" format="upca" showValue />);
    const value = container.querySelector('.ui-barcode__value');
    expect(value).toHaveTextContent(/^036000291452$/);
    expect(value?.previousElementSibling).toBe(svg(container));
    expect(screen.getByRole('img')).toHaveAccessibleName('UPC-A barcode: 036000291452');
    rerender(<Barcode value={'Crate 7\tShelf B'} showValue />);
    expect(container.firstElementChild).toHaveAttribute('data-format', 'code128');
    expect(container.querySelector('.ui-barcode__value')?.textContent).toBe('Crate 7\tShelf B');
    expectHooksMatchSpec(container, 'BARCODE', { slots: 'all' });
  });

  it('UIC-BARCODE-2.4 draws nothing and says why for a value the format cannot hold', () => {
    const { container, rerender } = render(
      <Barcode value="4006381333932" format="ean13" showValue />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-invalid', 'checksum');
    expect(svg(container)).toBeNull();
    expect(container.querySelector('.ui-barcode__value')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName('This value cannot be encoded in EAN-13.');
    rerender(<Barcode value="96-38" format="ean8" />);
    expect(container.firstElementChild).toHaveAttribute('data-invalid', 'characters');
    rerender(<Barcode value="" />);
    expect(container.firstElementChild).toHaveAttribute('data-invalid', 'length');
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'This value cannot be encoded in Code 128.',
    );
    expectHooksMatchSpec(container, 'BARCODE');
  });

  it('UIC-BARCODE-3.1 is an image named by the caller or by the format and value', () => {
    const { rerender } = render(<Barcode value="96385074" format="ean8" />);
    const image = screen.getByRole('img');
    expect(image).toHaveAccessibleName('EAN-8 barcode: 96385074');
    expect(image).not.toHaveAttribute('tabindex');
    expect(image.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(image.querySelector('svg')).toHaveAttribute('focusable', 'false');
    rerender(<Barcode value="96385074" format="ean8" aria-label="Pears, 1 kg" />);
    expect(screen.getByRole('img')).toHaveAccessibleName('Pears, 1 kg');
    rerender(
      <>
        <span id="caption">Crate label</span>
        <Barcode value="CRATE-7" aria-labelledby="caption" />
      </>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('Crate label');
    rerender(
      <UiProvider messages={{ barcodeOf: 'Code-barres {format} : {value}' }}>
        <Barcode value="9638507" format="ean8" />
      </UiProvider>,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName('Code-barres EAN-8 : 96385074');
  });

  it('UIC-BARCODE-3.2 forwards the class name, caller attributes, id and ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Barcode value="CRATE-7" className="label" id="code" data-kind="crate" ref={ref} />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-barcode', 'label');
    expect(root).toHaveAttribute('id', 'code');
    expect(root).toHaveAttribute('data-kind', 'crate');
    expect(ref.current).toBe(root);
    expectHooksMatchSpec(container, 'BARCODE', { callerAttributes: ['data-kind'] });
  });
});
