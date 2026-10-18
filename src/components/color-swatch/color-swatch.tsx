import { ColorSwatch as AriaColorSwatch } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';

export interface ColorSwatchProps extends BaseProps, AriaLabellingProps {
  /** Any CSS colour string. Nothing (or empty text) draws an empty swatch. */
  color?: string | null | undefined;
  /** Names the colour instead of its name in the locale. */
  colorName?: string | undefined;
  /** Box size. Defaults to `md`. */
  size?: Size | undefined;
}

const hooks = createHooks('color-swatch');

/** A colour shown on its own, named by its colour so assistive technology can read it. */
export function ColorSwatch({
  color,
  size = 'md',
  className,
  colorName,
  ...rest
}: ColorSwatchProps) {
  const strings = useUiStrings();
  const isEmpty = !color;
  return (
    <AriaColorSwatch
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, empty: isEmpty } })}
      color={isEmpty ? undefined : color}
      colorName={isEmpty ? strings.noColor : colorName}
    />
  );
}

export { ColorSwatchPicker, ColorSwatchPickerItem } from './color-swatch-picker.js';
export type {
  ColorSwatchPickerItemProps,
  ColorSwatchPickerLayout,
  ColorSwatchPickerProps,
} from './color-swatch-picker.js';
