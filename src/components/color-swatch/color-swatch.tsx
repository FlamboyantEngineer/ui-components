'use client';

import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import type { BaseProps, RefProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch as AriaColorSwatch, parseColor } from '../../primitives/index.js';

export interface ColorSwatchProps extends BaseProps, RefProps<HTMLDivElement>, AriaLabellingProps {
  /**
   * A hex, `rgb()`, `hsl()` or `hsb()` color string. Nothing, empty text or a color in another
   * notation draws an empty swatch.
   */
  color?: string | null | undefined;
  /** Names the color instead of its name in the locale. */
  colorName?: string | undefined;
  /** Box size. Defaults to `md`. */
  size?: Size | undefined;
}

const hooks = createHooks('color-swatch');

/** `color` as the CSS color the swatch draws, or nothing when it cannot draw it. */
function toSwatchFill(color: string | null | undefined): string | undefined {
  if (!color) return undefined;
  try {
    return parseColor(color).toString('css');
  } catch {
    return undefined;
  }
}

/** Whether the swatch can draw `color`: a hex, `rgb()`, `hsl()` or `hsb()` color string. */
export function isSwatchColor(color: string | null | undefined): color is string {
  return toSwatchFill(color) !== undefined;
}

/** A color shown on its own, named by its color so assistive technology can read it. */
export function ColorSwatch({
  color,
  size = 'md',
  className,
  colorName,
  ...rest
}: ColorSwatchProps) {
  const strings = useUiStrings();
  const fill = toSwatchFill(color);
  const drawn = fill === undefined ? undefined : (color ?? undefined);
  return (
    <AriaColorSwatch
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, empty: drawn === undefined } })}
      // The fill again, so a stylesheet can layer it over a checkerboard for a translucent color.
      style={fill === undefined ? undefined : measuredProperty('color-swatch-color', fill)}
      color={drawn}
      colorName={drawn === undefined ? strings.noColor : colorName}
    />
  );
}

export type { ColorSwatchButtonProps } from './color-swatch-button.js';
export { ColorSwatchButton } from './color-swatch-button.js';
export type {
  ColorSwatchPickerItemProps,
  ColorSwatchPickerLayout,
  ColorSwatchPickerProps,
} from './color-swatch-picker.js';
export { ColorSwatchPicker, ColorSwatchPickerItem } from './color-swatch-picker.js';
