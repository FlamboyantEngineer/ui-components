import { type ReactNode } from 'react';
import type { BaseProps, NativeProps } from '../../core/props.js';
import type { ButtonSize } from '../button/button.js';
import { type ZoomPreset } from './zoom-presets.js';
export interface ZoomControlProps extends Pick<NativeProps<'div'>, 'aria-label' | 'aria-labelledby'>, BaseProps {
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
/** The zoom levels, in percent, a control steps through when the caller gives none. */
export declare const defaultZoomLevels: readonly number[];
/** Index of the closest level after sorting and deduplicating finite levels; lower wins a tie. */
export declare function findNearestZoomLevelIndex(levels: readonly number[], value: number): number;
/**
 * The next level above (`1`) or below (`-1`) `value`, or `undefined` past the last or first level.
 * A value between levels steps to the neighbouring level on that side.
 */
export declare function findNextZoomLevel(levels: readonly number[], value: number, direction: 1 | -1): number | undefined;
/**
 * Zoom out, a slider over the zoom levels, zoom in and the current percentage, in one named group,
 * with an optional reset button.
 */
export declare function ZoomControl({ levels, value, defaultValue, onChange, resetValue, isDisabled, zoomOutButton, zoomInButton, formatOptions, size, presets, onPresetAction, 'aria-label': ariaLabel, className, ...rest }: ZoomControlProps): import("react").JSX.Element;
export type { ZoomPreset } from './zoom-presets.js';
//# sourceMappingURL=zoom-control.d.ts.map