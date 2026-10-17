import {
  ColorSwatch as AriaColorSwatch,
  type Color,
  type ColorSwatchProps as AriaColorSwatchProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';

export interface ColorSwatchProps
  extends Omit<AriaColorSwatchProps, 'className' | 'style' | 'color'>, BaseProps {
  /** Any CSS colour or React Aria colour. Nothing (or empty text) draws an empty swatch. */
  color?: string | Color | null | undefined;
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
export type { ColorSwatchPickerItemProps, ColorSwatchPickerProps } from './color-swatch-picker.js';
