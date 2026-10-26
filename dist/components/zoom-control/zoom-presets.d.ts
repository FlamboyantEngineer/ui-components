import type { ButtonSize } from '../button/button.js';
/** A zoom the preset menu offers that the caller resolves, such as fitting the page width. */
export interface ZoomPreset {
    /** Passed to `onPresetAction` when the preset is chosen. */
    id: string;
    /** The menu item's text. */
    label: string;
}
interface ZoomPresetMenuProps {
    /** Percentages and named presets, in menu order. No entries draw no menu. */
    presets: readonly (number | ZoomPreset)[] | undefined;
    onPresetAction: ((id: string) => void) | undefined;
    /** Formats a percentage entry like the control's value. */
    formatter: Intl.NumberFormat;
    className: string;
    size: ButtonSize;
    isDisabled: boolean;
    /** Requests a percentage entry's zoom. */
    onRequest: (value: number) => void;
}
/** A menu button whose items request a percentage or report a named preset. */
export declare function ZoomPresetMenu({ presets, onPresetAction, formatter, onRequest, ...trigger }: ZoomPresetMenuProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=zoom-presets.d.ts.map