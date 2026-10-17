import { useId, useMemo, useState, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { ButtonSize } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';

/** The zoom levels, in percent, a control steps through when the caller gives none. */
export const defaultZoomLevels: readonly number[] = [25, 50, 75, 100, 125, 150, 200, 300, 400];

export interface ZoomControlProps {
  /** The zoom levels in percent (`100` means 100%). Sorted ascending; duplicates are ignored. */
  levels?: readonly number[] | undefined;
  /** The current zoom in percent (controlled). It may lie between levels, for example a fit-to-width value. */
  value?: number | undefined;
  /** The initial zoom in percent (uncontrolled). Defaults to `100`. */
  defaultValue?: number | undefined;
  /** Called with the requested zoom level, in percent. */
  onChange?: ((value: number) => void) | undefined;
  /** When set, a reset button returns the zoom to this value. */
  resetValue?: number | undefined;
  /** Disables the slider and the built-in buttons. */
  isDisabled?: boolean | undefined;
  /** Replaces the built-in zoom-out button in its position, for hosts that own their zoom commands. */
  zoomOutButton?: ReactNode;
  /** Replaces the built-in zoom-in button in its position. */
  zoomInButton?: ReactNode;
  /** Number format for the displayed value, applied to the percentage itself (`137.5` → `137.5%`). */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Size of the built-in buttons, published for the stylesheet. Defaults to `sm`. */
  size?: ButtonSize | undefined;
  /** Names the group. Defaults to the provider's `zoom` string. */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const EPSILON = 1e-9;

const hooks = createHooks('zoom-control', ['zoom-out', 'slider', 'zoom-in', 'value', 'reset']);

function ladderOf(levels: readonly number[]): number[] {
  return [...new Set(levels)].filter(Number.isFinite).sort((a, b) => a - b);
}

/** Index of the level closest to `value`; the lower level wins a tie. */
export function nearestZoomLevelIndex(levels: readonly number[], value: number): number {
  const ladder = ladderOf(levels);
  let best = 0;
  ladder.forEach((level, index) => {
    if (Math.abs(level - value) < Math.abs((ladder[best] ?? level) - value) - EPSILON) best = index;
  });
  return best;
}

/**
 * The next level above (`1`) or below (`-1`) `value`, or `undefined` past the last or first level.
 * A value between levels steps to the neighbouring level on that side.
 */
export function nextZoomLevel(
  levels: readonly number[],
  value: number,
  direction: 1 | -1,
): number | undefined {
  const ladder = ladderOf(levels);
  return direction === 1
    ? ladder.find((level) => level > value + EPSILON)
    : ladder.findLast((level) => level < value - EPSILON);
}

/**
 * Zoom out, a slider over the zoom levels, zoom in and the current percentage, in one named group,
 * with an optional reset button.
 */
export function ZoomControl({
  levels = defaultZoomLevels,
  value: controlledValue,
  defaultValue = 100,
  onChange,
  resetValue,
  isDisabled = false,
  zoomOutButton,
  zoomInButton,
  formatOptions,
  size = 'sm',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  id,
  ...rest
}: ZoomControlProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const sliderId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const ladder = useMemo(() => ladderOf(levels), [levels]);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'percent',
        maximumFractionDigits: 20,
        ...formatOptions,
      }),
    [locale, formatOptions],
  );

  const request = (next: number) => {
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next);
  };
  const below = nextZoomLevel(ladder, value, -1);
  const above = nextZoomLevel(ladder, value, 1);
  const text = formatter.format(value);

  return (
    <div
      {...hooks.root({ className, props: rest, data: { size, disabled: isDisabled } })}
      id={id}
      role="group"
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : strings.zoom)}
      aria-labelledby={ariaLabelledBy}
    >
      {zoomOutButton ?? (
        <IconButton
          className={hooks.slotClass('zoom-out')}
          icon="minus"
          label={strings.zoomOut}
          size={size}
          isDisabled={isDisabled || below === undefined}
          focusableWhenDisabled={!isDisabled}
          onPress={() => {
            if (below !== undefined) request(below);
          }}
        />
      )}
      <input
        {...hooks.slot('slider')}
        id={sliderId}
        type="range"
        min={0}
        max={Math.max(0, ladder.length - 1)}
        step={1}
        value={nearestZoomLevelIndex(ladder, value)}
        disabled={isDisabled}
        aria-label={strings.zoomLevel}
        aria-valuetext={text}
        onChange={(event) => {
          const level = ladder[Number.parseInt(event.currentTarget.value, 10)];
          if (level !== undefined) request(level);
        }}
      />
      {zoomInButton ?? (
        <IconButton
          className={hooks.slotClass('zoom-in')}
          icon="plus"
          label={strings.zoomIn}
          size={size}
          isDisabled={isDisabled || above === undefined}
          focusableWhenDisabled={!isDisabled}
          onPress={() => {
            if (above !== undefined) request(above);
          }}
        />
      )}
      <output {...hooks.slot('value')} htmlFor={sliderId}>
        {text}
      </output>
      {resetValue !== undefined ? (
        <IconButton
          className={hooks.slotClass('reset')}
          icon="restore"
          label={strings.resetZoom}
          size={size}
          isDisabled={isDisabled || Math.abs(value - resetValue) < EPSILON}
          focusableWhenDisabled={!isDisabled}
          onPress={() => request(resetValue)}
        />
      ) : null}
    </div>
  );
}
