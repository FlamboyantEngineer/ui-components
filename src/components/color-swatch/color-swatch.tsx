import { ColorSwatch as AriaColorSwatch, parseColor } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';

export interface ColorSwatchProps extends BaseProps, AriaLabellingProps {
  /**
   * A hex, `rgb()`, `hsl()` or `hsb()` colour string. Nothing, empty text or a colour in another
   * notation draws an empty swatch.
   */
  color?: string | null | undefined;
  /** Names the colour instead of its name in the locale. */
  colorName?: string | undefined;
  /** Box size. Defaults to `md`. */
  size?: Size | undefined;
}

const hooks = createHooks('color-swatch');

/** Whether the swatch can draw `color`: a hex, `rgb()`, `hsl()` or `hsb()` colour string. */
export function isSwatchColor(color: string | null | undefined): color is string {
  if (!color) return false;
  try {
    parseColor(color);
    return true;
  } catch {
    return false;
  }
}

/** A colour shown on its own, named by its colour so assistive technology can read it. */
export function ColorSwatch({
  color,
  size = 'md',
  className,
  colorName,
  ...rest
}: ColorSwatchProps) {
  const strings = useUiStrings();
  const drawn = isSwatchColor(color) ? color : undefined;
  return (
    <AriaColorSwatch
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, empty: drawn === undefined } })}
      color={drawn}
      colorName={drawn === undefined ? strings.noColor : colorName}
    />
  );
}

export { ColorSwatchPicker, ColorSwatchPickerItem } from './color-swatch-picker.js';
export type {
  ColorSwatchPickerItemProps,
  ColorSwatchPickerLayout,
  ColorSwatchPickerProps,
} from './color-swatch-picker.js';
