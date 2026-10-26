import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
/** The pane whose size the handle's value reports, relative to the separator. */
export type ResizeHandleSizedPane = 'before' | 'after';
export interface ResizeKeyboardInput {
    /** The direction of the separator bar itself. */
    orientation: Orientation;
    value: number;
    minValue: number;
    maxValue: number;
    /** Full length of the split in value units: 100 for percentages, pixels otherwise. */
    extent: number;
    sizedPane?: ResizeHandleSizedPane | undefined;
    direction?: 'ltr' | 'rtl' | undefined;
}
export interface ResizeHandleProps extends Omit<NativeProps<'div'>, 'children' | 'role' | 'onChange' | 'aria-orientation' | 'aria-valuenow' | 'aria-valuemin' | 'aria-valuemax'>, BaseProps {
    /** The direction of the bar: `vertical` between side-by-side panes, `horizontal` between stacked ones. */
    orientation: Orientation;
    /** The size of the sized pane, in any unit. */
    value: number;
    /** The smallest value. */
    minValue: number;
    /** The largest value. */
    maxValue: number;
    /** Full length of the split in value units; the keyboard steps a share of it. Defaults to 100. */
    extent?: number | undefined;
    /** Value units per pixel of pointer travel, read when a drag starts. Defaults to 1. */
    getUnitsPerPixel?: (() => number) | undefined;
    /** The pane `value` sizes. Defaults to the pane `before` the separator. */
    sizedPane?: ResizeHandleSizedPane | undefined;
    /** Each new value from a drag or a key. */
    onChange?: ((value: number) => void) | undefined;
    /** The value after a drag ends or a key step. */
    onChangeEnd?: ((value: number) => void) | undefined;
    /** Called when a pointer drag starts and ends. */
    onResizingChange?: ((isResizing: boolean) => void) | undefined;
    /** Ignore pointer and keyboard input and leave the tab order. */
    isDisabled?: boolean | undefined;
}
/** Arrow keys step this share of the extent; Shift+arrows step the fine share. */
export declare const RESIZE_KEYBOARD_STEP = 5;
export declare const RESIZE_KEYBOARD_FINE_STEP = 1;
/**
 * The window-splitter keyboard contract: the arrow keys along the separator's axis move it by 5 % of
 * the extent, Shift+arrows by 1 %, Home and End jump to the smallest and largest value. Moving the
 * separator toward the inline end (or down) grows the pane before it. Returns the clamped next value,
 * or `null` for a key that does not resize.
 */
export declare function resolveResizeKeyboardValue(event: {
    key: string;
    shiftKey: boolean;
}, { orientation, value, minValue, maxValue, extent, sizedPane, direction, }: ResizeKeyboardInput): number | null;
/**
 * A focusable window splitter (`role="separator"`) that resizes the pane beside it by pointer drag,
 * with pointer capture, and by keyboard. While a drag is in progress it renders a viewport shield so
 * the stylesheet can keep the resize cursor everywhere.
 */
export declare function ResizeHandle({ orientation, value, minValue, maxValue, extent, getUnitsPerPixel, sizedPane, onChange, onChangeEnd, onResizingChange, isDisabled, className, ...rest }: ResizeHandleProps): import("react").JSX.Element;
//# sourceMappingURL=resize-handle.d.ts.map