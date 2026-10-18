import { createContext, useContext } from 'react';
import {
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  type ColorSwatchPickerItemProps as AriaColorSwatchPickerItemProps,
  type ColorSwatchPickerProps as AriaColorSwatchPickerProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { ColorSwatch } from './color-swatch.js';

export interface ColorSwatchPickerProps
  extends Omit<AriaColorSwatchPickerProps, 'className' | 'style'>, BaseProps {
  /** The size of every swatch in the list. Defaults to `md`. */
  size?: Size | undefined;
}

export interface ColorSwatchPickerItemProps
  extends
    Omit<AriaColorSwatchPickerItemProps, 'className' | 'style' | 'children' | 'render'>,
    BaseProps {
  /** Names the colour instead of its name in the locale. */
  colorName?: string | undefined;
}

const hooks = createHooks('color-swatch-picker', ['item']);

const SwatchSizeContext = createContext<Size>('md');

/**
 * A list of colour swatches to choose one from (React Aria `ColorSwatchPicker`): a single-selection
 * listbox whose arrow keys move between swatches and whose Enter or Space picks one.
 */
export function ColorSwatchPicker({
  size = 'md',
  className,
  children,
  ...rest
}: ColorSwatchPickerProps) {
  return (
    <AriaColorSwatchPicker {...rest} {...hooks.root({ className, props: rest, data: { size } })}>
      <SwatchSizeContext.Provider value={size}>{children}</SwatchSizeContext.Provider>
    </AriaColorSwatchPicker>
  );
}

/** One choice of a `ColorSwatchPicker`: an option drawing its colour as a `ColorSwatch`. */
export function ColorSwatchPickerItem({
  color,
  colorName,
  className,
  ...rest
}: ColorSwatchPickerItemProps) {
  const size = useContext(SwatchSizeContext);
  return (
    <AriaColorSwatchPickerItem
      {...rest}
      {...hooks.slot('item', undefined, className)}
      color={color}
    >
      <ColorSwatch color={color} colorName={colorName} size={size} />
    </AriaColorSwatchPickerItem>
  );
}
