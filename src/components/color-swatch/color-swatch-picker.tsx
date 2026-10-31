'use client';

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  parseColor,
  useLocale,
  ColorSwatchPickerContext,
  ListBox,
  ListBoxItem,
  type Color,
} from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch, isSwatchColor } from './color-swatch.js';
import { useScopedDisabled } from '../field/field.js';

/** How the swatches are laid out: a grid (the arrow keys move in two dimensions) or a stack. */
export type ColorSwatchPickerLayout = 'grid' | 'stack';

export interface ColorSwatchPickerProps extends BaseProps, AriaLabellingProps {
  /**
   * The picked colour, as a hex, `rgb()`, `hsl()` or `hsb()` string (controlled). Empty or unreadable
   * text picks nothing.
   */
  value?: string | undefined;
  /** The colour picked at first, when uncontrolled. Nothing is picked without it. */
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

/** What the items tell their picker: their size, and where to list their colour text by key. */
interface PickerItems {
  size: Size;
  register: (key: string, color: string) => () => void;
}

const PickerItemsContext = createContext<PickerItems>({ size: 'md', register: () => () => {} });

/** The canonical form of a colour, which compares colours whatever their spelling. */
function toColorKey(color: string | null): string | null {
  return isSwatchColor(color) ? parseColor(color).toString('hexa') : null;
}

/** The value and change handler a surrounding React Aria colour picker gives its swatches. */
function useSurroundingPicker() {
  const context = useContext(ColorSwatchPickerContext) as {
    value?: Color | string;
    onChange?: (color: Color) => void;
  } | null;
  const value = context?.value;
  return {
    value: typeof value === 'object' ? value.toString('hexa') : value,
    onChange: context?.onChange,
  };
}

/**
 * Each item's colour text by its own key. Items are told apart by identity, not colour, so equal
 * colours in different spellings (or the same spelling twice) are separate options.
 */
function useItemColors() {
  const [colors, setColors] = useState<ReadonlyMap<string, string>>(new Map());
  const register = useMemo(
    () => (key: string, color: string) => {
      setColors((current) => new Map(current).set(key, color));
      return () =>
        setColors((current) => {
          const next = new Map(current);
          next.delete(key);
          return next;
        });
    },
    [],
  );
  return { colors, register };
}

/**
 * A list of colour swatches to choose one from: a single-selection listbox whose arrow keys move
 * between swatches and whose Enter or Space picks one. Every item of the picked colour shows as
 * picked, whatever its spelling.
 */
export function ColorSwatchPicker({
  size = 'md',
  layout = 'grid',
  className,
  children,
  value,
  defaultValue,
  onChange,
  ...rest
}: ColorSwatchPickerProps) {
  const strings = useUiStrings();
  const surrounding = useSurroundingPicker();
  const [picked, setPicked] = useControllableState<string | null>(
    value ?? surrounding.value,
    defaultValue ?? null,
    (color) => {
      if (color === null) return;
      onChange?.(color);
      surrounding.onChange?.(parseColor(color));
    },
  );
  const { colors, register } = useItemColors();
  const pickedKey = toColorKey(picked);
  const selectedKeys = [...colors].filter(([, color]) => toColorKey(color) === pickedKey);
  const items = useMemo(() => ({ size, register }), [size, register]);
  return (
    <ListBox
      {...rest}
      {...hooks.root({ className, props: rest, data: { size } })}
      aria-label={
        rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : strings.colorSwatches)
      }
      layout={layout}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selectedKeys.map(([key]) => key)}
      onSelectionChange={(keys) => {
        const [key] = keys === 'all' ? [] : [...keys];
        const color = key === undefined ? undefined : colors.get(String(key));
        if (color !== undefined) setPicked(color);
      }}
    >
      <PickerItemsContext value={items}>{children}</PickerItemsContext>
    </ListBox>
  );
}

/** One choice of a `ColorSwatchPicker`: an option drawing its colour as a `ColorSwatch`. */
export function ColorSwatchPickerItem({
  color,
  colorName,
  className,
  ...rest
}: ColorSwatchPickerItemProps) {
  const { size, register } = useContext(PickerItemsContext);
  const { locale } = useLocale();
  const key = useId();
  const isDisabled = useScopedDisabled(rest.isDisabled);
  const isShown = isSwatchColor(color);
  useLayoutEffect(
    () => (isShown ? register(key, color) : undefined),
    [register, key, color, isShown],
  );
  if (!isShown) return null;
  return (
    <ListBoxItem
      {...rest}
      isDisabled={isDisabled}
      {...hooks.slot('item', undefined, className)}
      id={key}
      textValue={colorName ?? parseColor(color).getColorName(locale)}
    >
      <ColorSwatch color={color} colorName={colorName} size={size} />
    </ListBoxItem>
  );
}
