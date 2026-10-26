import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
import type { ButtonGroupDensity } from '../button-group/button-group.js';
import { type LayoutContainmentProps, type LayoutJustify, type LayoutSpace } from './layout.js';
export type ToolbarRowRole = 'toolbar' | 'group' | 'none';
export type ToolbarRowVariant = 'plain' | 'surface';
/**
 * `wrap` flows the controls, and the groups holding them, onto more rows; `scroll` keeps them on
 * one row that scrolls in a `ToolbarScroller`; `none` keeps one row and leaves overflow to the caller.
 */
export type ToolbarRowOverflow = 'wrap' | 'scroll' | 'none';
/** `regular` spaces a group's controls apart; `attached` joins them into one segmented run. */
export type ToolbarRowGroupDensity = Extract<ButtonGroupDensity, 'regular' | 'attached'>;
export interface ToolbarRowProps extends Omit<NativeProps<'div'>, 'role'>, BaseProps, LayoutContainmentProps {
    /** `toolbar` (default) moves focus by arrow keys, `group` keeps tab stops, `none` has no role. */
    role?: ToolbarRowRole | undefined;
    /** `surface` asks the stylesheet for a surface behind the row. Defaults to `plain`. */
    variant?: ToolbarRowVariant | undefined;
    /** `vertical` stacks the controls, and a toolbar moves focus with Up and Down. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** Gap between controls. Defaults to `md`. */
    space?: LayoutSpace | undefined;
    /** Distribution of controls. Defaults to `end`. */
    justify?: LayoutJustify | undefined;
    /** What happens to controls that do not fit on one horizontal row. Defaults to `wrap`. */
    overflow?: ToolbarRowOverflow | undefined;
    /** The row keeps its place but its controls are inert, as while the surface they serve starts. */
    isPending?: boolean | undefined;
}
export interface ToolbarRowGroupProps extends BaseProps, AriaLabellingProps {
    /** The group's controls. Name the group with `aria-label` or `aria-labelledby`. */
    children?: ReactNode;
    /** How close the controls sit. Defaults to `regular`. */
    density?: ToolbarRowGroupDensity | undefined;
}
export type ToolbarRowSeparatorProps = BaseProps;
/** A row of controls, vertically centred, with a gap; or a column of them when vertical. */
export declare function ToolbarRow({ children, className, role, variant, orientation, space, justify, overflow: requestedOverflow, isPending, grow, fill, clip, ...rest }: ToolbarRowProps): import("react").JSX.Element;
/**
 * A named group of related controls inside a `ToolbarRow` (`role="group"`), laid out along the
 * row. In a toolbar, arrow keys still move through every control of the row.
 */
export declare function ToolbarRowGroup({ children, className, density, ...rest }: ToolbarRowGroupProps): import("react").JSX.Element;
/** A divider between controls or groups of a `ToolbarRow`, across the row: a `Separator`. */
export declare function ToolbarRowSeparator({ className, ...rest }: ToolbarRowSeparatorProps): import("react").JSX.Element;
//# sourceMappingURL=toolbar-row.d.ts.map