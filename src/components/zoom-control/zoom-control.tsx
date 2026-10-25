import { useId, useMemo, type ReactNode } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { ButtonSize } from '../button/button.js';
import { Button } from '../button/button.js';
import { ZoomPresetMenu, type ZoomPreset } from './zoom-presets.js';
import { resolveZoomLevels, sortZoomLevels } from './zoom-levels.js';

export interface ZoomControlProps
  extends Pick<NativeProps<'div'>, 'aria-label' | 'aria-labelledby'>, BaseProps {
  /** Finite zoom levels in percent (`100` means 100%). Sorted ascending; duplicates are ignored. */
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
  /**
   * The entries of a preset menu after the value, in order: percentages, which request that zoom,
   * and named presets, which call `onPresetAction`. Without it the control has no preset menu.
   */
  presets?: readonly (number | ZoomPreset)[] | undefined;
  /** Called with the id of the named preset chosen in the preset menu. */
  onPresetAction?: ((id: string) => void) | undefined;
}

interface ZoomButtonProps {
  slot: 'zoom-out' | 'zoom-in' | 'reset';
  icon: GlyphName;
  label: string;
  /** The zoom the button requests, or `undefined` while it has none to request. */
  target: number | undefined;
  size: ButtonSize;
  isDisabled: boolean;
  onRequest: (value: number) => void;
}

interface ZoomSliderProps {
  id: string;
  levels: readonly number[];
  /** The nearest level's index, and the levels the step buttons request. */
  targets: ReturnType<typeof resolveZoomLevels>;
  valueText: string;
  isDisabled: boolean;
  onRequest: (value: number) => void;
}

/** The zoom levels, in percent, a control steps through when the caller gives none. */
export const defaultZoomLevels: readonly number[] = [25, 50, 75, 100, 125, 150, 200, 300, 400];

// Levels and values are compared with a tolerance, so floating-point zoom values match their level.
const tolerance = 1e-9;

const hooks = createHooks('zoom-control', [
  'zoom-out',
  'slider',
  'zoom-in',
  'value',
  'presets',
  'reset',
]);

function useZoomFormatter(formatOptions: Intl.NumberFormatOptions | undefined) {
  return useNumberFormatter({
    style: 'unit',
    unit: 'percent',
    maximumFractionDigits: 20,
    ...formatOptions,
  });
}

/** A built-in button that requests its target zoom, disabled but focusable while it has none. */
function ZoomButton({ slot, icon, label, target, size, isDisabled, onRequest }: ZoomButtonProps) {
  return (
    <Button
      className={hooks.slotClass(slot)}
      icon={icon}
      label={label}
      size={size}
      isDisabled={isDisabled || target === undefined}
      focusableWhenDisabled={!isDisabled}
      onPress={() => {
        if (target !== undefined) onRequest(target);
      }}
    />
  );
}

/**
 * A native range input over the level indices. One step from a value between levels requests the
 * neighbouring level on that side, as the step buttons do, rather than skipping it.
 */
function ZoomSlider({ id, levels, targets, valueText, isDisabled, onRequest }: ZoomSliderProps) {
  const { index, previous, next } = targets;
  const strings = useUiStrings();
  return (
    <input
      {...hooks.slot('slider')}
      id={id}
      type="range"
      min={0}
      max={Math.max(0, levels.length - 1)}
      step={1}
      value={index}
      disabled={isDisabled}
      aria-label={strings.zoomLevel}
      aria-valuetext={valueText}
      onChange={(event) => {
        const position = Number.parseInt(event.currentTarget.value, 10);
        const step = { [index - 1]: previous, [index + 1]: next }[position];
        const level = step ?? levels[position];
        if (level !== undefined) onRequest(level);
      }}
    />
  );
}

/** Index of the closest level after sorting and deduplicating finite levels; lower wins a tie. */
export function findNearestZoomLevelIndex(levels: readonly number[], value: number): number {
  return resolveZoomLevels(sortZoomLevels(levels), value).index;
}

/**
 * The next level above (`1`) or below (`-1`) `value`, or `undefined` past the last or first level.
 * A value between levels steps to the neighbouring level on that side.
 */
export function findNextZoomLevel(
  levels: readonly number[],
  value: number,
  direction: 1 | -1,
): number | undefined {
  const targets = resolveZoomLevels(sortZoomLevels(levels), value);
  return direction === 1 ? targets.next : targets.previous;
}

/**
 * Zoom out, a slider over the zoom levels, zoom in and the current percentage, in one named group,
 * with an optional reset button.
 */
export function ZoomControl({
  levels = defaultZoomLevels,
  value,
  defaultValue = 100,
  onChange,
  resetValue,
  isDisabled = false,
  zoomOutButton,
  zoomInButton,
  formatOptions,
  size = 'sm',
  presets,
  onPresetAction,
  'aria-label': ariaLabel,
  className,
  ...rest
}: ZoomControlProps) {
  const strings = useUiStrings();
  const sliderId = useId();
  const [current, request] = useControllableState(value, defaultValue, onChange);
  const sorted = useMemo(() => sortZoomLevels(levels), [levels]);
  const targets = resolveZoomLevels(sorted, current);
  const formatter = useZoomFormatter(formatOptions);
  const valueText = formatter.format(current);
  const buttonProps = { size, isDisabled, onRequest: request };

  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, disabled: isDisabled } })}
      role="group"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.zoom)}
    >
      {zoomOutButton ?? (
        <ZoomButton
          {...buttonProps}
          slot="zoom-out"
          icon="minus"
          label={strings.zoomOut}
          target={targets.previous}
        />
      )}
      <ZoomSlider
        id={sliderId}
        levels={sorted}
        targets={targets}
        valueText={valueText}
        isDisabled={isDisabled}
        onRequest={request}
      />
      {zoomInButton ?? (
        <ZoomButton
          {...buttonProps}
          slot="zoom-in"
          icon="plus"
          label={strings.zoomIn}
          target={targets.next}
        />
      )}
      <output {...hooks.slot('value')} htmlFor={sliderId}>
        {valueText}
      </output>
      <ZoomPresetMenu
        {...buttonProps}
        className={hooks.slotClass('presets')}
        presets={presets}
        onPresetAction={onPresetAction}
        formatter={formatter}
      />
      {resetValue === undefined ? null : (
        <ZoomButton
          {...buttonProps}
          slot="reset"
          icon="restore"
          label={strings.resetZoom}
          target={Math.abs(current - resetValue) < tolerance ? undefined : resetValue}
        />
      )}
    </div>
  );
}

export type { ZoomPreset } from './zoom-presets.js';
