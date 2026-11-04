'use client';

import { type ReactNode, useId, useMemo } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { type GlyphComponent, MinusGlyph, PlusGlyph, RestoreGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ControlSize, NativeProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useNumberFormatter } from '../../primitives/index.js';
import { Button } from '../button/button.js';
import {
  defaultZoomLevels,
  resolveSliderStops,
  resolveZoomLevels,
  sortZoomLevels,
} from './zoom-levels.js';
import { type ZoomPreset, ZoomPresetMenu } from './zoom-presets.js';

export interface ZoomControlProps
  extends
    RefProps<HTMLDivElement>,
    Pick<NativeProps<'div'>, 'aria-label' | 'aria-labelledby'>,
    BaseProps {
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
  size?: ControlSize | undefined;
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
  icon: GlyphComponent;
  label: string;
  /** The zoom the button requests, or `undefined` while it has none to request. */
  target: number | undefined;
  size: ControlSize;
  isDisabled: boolean;
  onRequest: (value: number) => void;
}

interface ZoomSliderProps {
  id: string;
  levels: readonly number[];
  value: number;
  valueText: string;
  isDisabled: boolean;
  onRequest: (value: number) => void;
}

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
 * A native range input over the slider's stops: the levels, and the current value as a stop of its
 * own while it lies between them. One step, Home, End or a drag requests the level at the new stop,
 * so every neighbouring level is reachable, endpoints included, and the current value too.
 */
function ZoomSlider({ id, levels, value, valueText, isDisabled, onRequest }: ZoomSliderProps) {
  const { stops, index } = resolveSliderStops(levels, value);
  const strings = useUiStrings();
  return (
    <input
      {...hooks.slot('slider')}
      id={id}
      type="range"
      min={0}
      max={Math.max(0, stops.length - 1)}
      step={1}
      value={index}
      disabled={isDisabled}
      aria-label={strings.zoomLevel}
      aria-valuetext={valueText}
      onChange={(event) => {
        const stop = stops[Number.parseInt(event.currentTarget.value, 10)];
        if (stop !== undefined) onRequest(stop);
      }}
    />
  );
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
          icon={MinusGlyph}
          label={strings.zoomOut}
          target={targets.previous}
        />
      )}
      <ZoomSlider
        id={sliderId}
        levels={sorted}
        value={current}
        valueText={valueText}
        isDisabled={isDisabled}
        onRequest={request}
      />
      {zoomInButton ?? (
        <ZoomButton
          {...buttonProps}
          slot="zoom-in"
          icon={PlusGlyph}
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
          icon={RestoreGlyph}
          label={strings.resetZoom}
          target={Math.abs(current - resetValue) < tolerance ? undefined : resetValue}
        />
      )}
    </div>
  );
}

export { defaultZoomLevels, findNearestZoomLevelIndex, findNextZoomLevel } from './zoom-levels.js';
export type { ZoomPreset } from './zoom-presets.js';
