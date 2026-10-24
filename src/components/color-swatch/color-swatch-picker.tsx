import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
  parseColor,
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { ColorSwatch, isSwatchColor } from './color-swatch.js';

/** How the swatches are laid out: a grid (the arrow keys move in two dimensions) or a stack. */
export type ColorSwatchPickerLayout = 'grid' | 'stack';

export interface ColorSwatchPickerProps extends BaseProps, AriaLabellingProps {
  /** The picked colour, as a hex, `rgb()`, `hsl()` or `hsb()` string (controlled). */
  value?: string | undefined;
  /** The colour picked at first, when uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the picked item's `color`, as the item gives it. */
  onChange?: ((color: string) => void) | undefined;
  /** Defaults to `grid`. */
  layout?: ColorSwatchPickerLayout | undefined;
  /** The size of every swatch in the list. Defaults to `md`. */
  size?: Size | undefined;
  /** The `ColorSwatchPickerItem` choices. */
  children: ReactNode;
}

export interface ColorSwatchPickerItemProps extends Omit<BaseProps, 'id'> {
  /**
   * The colour, as a hex, `rgb()`, `hsl()` or `hsb()` string; it is also what `onChange` receives.
   * An item whose colour is in another notation is left out.
   */
  color: string;
  /** Names the colour instead of its name in the locale. */
  colorName?: string | undefined;
  /** Keeps the swatch listed but not pickable. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('color-swatch-picker', ['item']);

const SwatchSizeContext = createContext<Size>('md');

/** Each item's colour text by the key the building block gives it, to report picks as given. */
const ColorTextsContext = createContext<Map<string, string> | null>(null);

function toColorKey(color: string): string {
  return parseColor(color).toString('hexa');
}

/**
 * A list of colour swatches to choose one from (React Aria `ColorSwatchPicker`): a single-selection
 * listbox whose arrow keys move between swatches and whose Enter or Space picks one.
 */
export function ColorSwatchPicker({
  size = 'md',
  className,
  children,
  value,
  defaultValue,
  onChange,
  ...rest
}: ColorSwatchPickerProps) {
  const texts = useMemo(() => new Map<string, string>(), []);
  return (
    <AriaColorSwatchPicker
      {...rest}
      {...hooks.root({ className, props: rest, data: { size } })}
      value={isSwatchColor(value) ? value : undefined}
      defaultValue={isSwatchColor(defaultValue) ? defaultValue : undefined}
      onChange={
        onChange
          ? (color) => {
              const key = color.toString('hexa');
              onChange(texts.get(key) ?? key);
            }
          : undefined
      }
    >
      <ColorTextsContext value={texts}>
        <SwatchSizeContext value={size}>{children}</SwatchSizeContext>
      </ColorTextsContext>
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
  const texts = useContext(ColorTextsContext);
  const isShown = isSwatchColor(color);
  useEffect(() => {
    if (!isShown) return;
    const key = toColorKey(color);
    texts?.set(key, color);
    return () => {
      if (texts?.get(key) === color) texts.delete(key);
    };
  }, [texts, color, isShown]);
  if (!isShown) return null;
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
