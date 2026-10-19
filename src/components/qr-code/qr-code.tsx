import { useMemo, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { encodeQr, type QrErrorCorrection } from '../../utils/encode-qr.js';

export interface QrCodeProps extends BaseProps, AriaLabellingProps {
  /** The text to encode, such as a URL. */
  value: string;
  /** How much damage the code survives: `low`, `medium` (the default), `quartile` or `high`. */
  errorCorrection?: QrErrorCorrection | undefined;
  /** The light margin around the symbol, in modules. Defaults to 4, the margin readers expect. */
  quietZone?: number | undefined;
  /** The drawn size of one module, in pixels. Defaults to 4. */
  moduleSize?: number | undefined;
  /** The `<svg>` element. */
  ref?: Ref<SVGSVGElement> | undefined;
}

const hooks = createHooks('qr-code', ['modules']);

const defaultQuietZone = 4;
const defaultModuleSize = 4;

function wholeOrDefault(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : fallback;
}

/** One path for the dark modules: a rectangle per horizontal run, offset by the quiet zone. */
function tracePath(modules: ReadonlyArray<readonly boolean[]>, offset: number): string {
  const parts: string[] = [];
  modules.forEach((row, y) => {
    let start = -1;
    row.forEach((dark, x) => {
      if (dark && start < 0) start = x;
      const isRunEnd = start >= 0 && (!dark || x === row.length - 1);
      if (!isRunEnd) return;
      const end = dark ? x + 1 : x;
      parts.push(`M${start + offset} ${y + offset}h${end - start}v1h${start - end}z`);
      start = -1;
    });
  });
  return parts.join('');
}

/**
 * A QR code for `value`, drawn as an SVG image of its dark modules with a quiet zone around them.
 * The host stylesheet colours the modules and the ground; unstyled, they are black on the page.
 */
export function QrCode({
  value,
  errorCorrection = 'medium',
  quietZone,
  moduleSize,
  className,
  'aria-label': ariaLabel,
  ...rest
}: QrCodeProps) {
  const strings = useUiStrings();
  const symbol = useMemo(() => encodeQr(value, { errorCorrection }), [value, errorCorrection]);
  const margin = wholeOrDefault(quietZone, defaultQuietZone);
  const scale =
    moduleSize !== undefined && Number.isFinite(moduleSize) && moduleSize > 0
      ? moduleSize
      : defaultModuleSize;
  const extent = (symbol?.size ?? 21) + margin * 2;
  const label = symbol ? strings.qrCodeOf(value) : strings.qrCodeTooLong;
  return (
    <svg
      {...rest}
      {...hooks.root({
        className,
        data: { errorCorrection, version: symbol?.version, invalid: symbol === undefined },
      })}
      role="img"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : label)}
      width={extent * scale}
      height={extent * scale}
      viewBox={`0 0 ${extent} ${extent}`}
      shapeRendering="crispEdges"
      focusable="false"
    >
      {symbol ? <path {...hooks.slot('modules')} d={tracePath(symbol.modules, margin)} /> : null}
    </svg>
  );
}
