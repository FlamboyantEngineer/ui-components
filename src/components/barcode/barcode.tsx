'use client';

import { useMemo } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { encodeBarcode, type BarcodeFormat } from './encode-barcode.js';

export interface BarcodeProps extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The value to encode: text for `code128`, digits for the EAN and UPC formats. */
  value: string;
  /** The symbology. Defaults to `code128`. */
  format?: BarcodeFormat | undefined;
  /** The drawn width of the narrowest bar, in whole pixels. Defaults to 2. */
  moduleWidth?: number | undefined;
  /** The drawn height of the bars, in pixels. Defaults to 64. */
  height?: number | undefined;
  /** The light margin on each side, in modules; never less than the format requires. */
  quietZone?: number | undefined;
  /** Shows the human-readable value under the bars, check digit included. */
  showValue?: boolean | undefined;
}

const hooks = createHooks('barcode', ['symbol', 'bars', 'value']);

/** The format names readers know; they are names, so they are the same in every language. */
const formatNames: Record<BarcodeFormat, string> = {
  code128: 'Code 128',
  ean13: 'EAN-13',
  upca: 'UPC-A',
  ean8: 'EAN-8',
};

const defaultModuleWidth = 2;
const defaultHeight = 64;

/** A positive whole number of pixels, so every bar covers whole device pixels at 1x. */
function readModuleWidth(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value >= 1
    ? Math.trunc(value)
    : defaultModuleWidth;
}

function readHeight(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : defaultHeight;
}

/**
 * The light modules before and after the bars: `quietZone` when it is a larger whole number, else
 * what the format requires.
 */
function readQuietZone(least: readonly [number, number], quietZone: number | undefined) {
  const asked = quietZone !== undefined && Number.isFinite(quietZone) ? Math.trunc(quietZone) : 0;
  return { start: Math.max(least[0], asked), end: Math.max(least[1], asked) };
}

/** One path for the bars: a rectangle per run of dark modules, a unit tall, after the quiet zone. */
function traceBars(modules: readonly boolean[], offset: number): string {
  const parts: string[] = [];
  let start = -1;
  modules.forEach((dark, index) => {
    if (dark && start < 0) start = index;
    const isRunEnd = start >= 0 && (!dark || index === modules.length - 1);
    if (!isRunEnd) return;
    const end = dark ? index + 1 : index;
    parts.push(`M${start + offset} 0h${end - start}v1h${start - end}z`);
    start = -1;
  });
  return parts.join('');
}

/**
 * A linear barcode for `value`: an image of its bars between light quiet zones, with the
 * human-readable value under them on request. The host stylesheet colours the bars and the ground.
 */
export function Barcode({
  value,
  format = 'code128',
  moduleWidth,
  height,
  quietZone,
  showValue = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: BarcodeProps) {
  const strings = useUiStrings();
  const { symbol, invalid } = useMemo(() => encodeBarcode(value, format), [value, format]);
  const name = formatNames[format];
  const label = symbol ? strings.barcodeOf(name, symbol.text) : strings.barcodeInvalid(name);
  const scale = readModuleWidth(moduleWidth);
  const zone = readQuietZone(symbol?.quietZone ?? [0, 0], quietZone);
  const extent = zone.start + (symbol?.modules.length ?? 0) + zone.end;
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { format, invalid } })}
      role="img"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : label)}
    >
      {symbol ? (
        <svg
          {...hooks.slot('symbol')}
          width={extent * scale}
          height={readHeight(height)}
          viewBox={`0 0 ${extent} 1`}
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          aria-hidden="true"
          focusable="false"
        >
          <path {...hooks.slot('bars')} d={traceBars(symbol.modules, zone.start)} />
        </svg>
      ) : null}
      {symbol && showValue ? <span {...hooks.slot('value')}>{symbol.text}</span> : null}
    </div>
  );
}
