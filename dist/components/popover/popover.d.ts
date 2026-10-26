import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { OpenStateProps, OverlayDismissProps, OverlayPositionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
/** A pressable trigger and the `Popover` it opens. */
export interface PopoverTriggerProps extends OpenStateProps {
    /** The trigger (a `Button` or another pressable), then its `Popover`. */
    children: ReactNode;
}
/** The floating panel the library's anchored overlays share, carrying the caller's hooks. */
export interface PopoverPanelProps extends BaseProps, OverlayPositionProps, Omit<OverlayDismissProps, 'isDismissable'>, Pick<OpenStateProps, 'isOpen' | 'onOpenChange'> {
    /** The element it is placed against, outside a trigger or instead of the trigger. */
    triggerRef?: RefObject<Element | null> | undefined;
    /** Leaves the page outside reachable, visible to assistive technology and scrollable. */
    isNonModal?: boolean | undefined;
    /** The arrow's hook class; when given, an arrow pointing at the trigger leads the panel. */
    arrowClassName?: string | undefined;
    /** Measured properties for the panel, such as a dropdown's `--ui-trigger-width`. */
    style?: CSSProperties | undefined;
    'aria-label'?: string | undefined;
    'aria-labelledby'?: string | undefined;
    children: ReactNode;
}
export interface PopoverRenderProps {
    /** Closes the popover. */
    close: () => void;
}
export interface PopoverProps extends BaseProps, OverlayPositionProps, Omit<OverlayDismissProps, 'isDismissable'>, Pick<OpenStateProps, 'isOpen' | 'onOpenChange'> {
    /** Outside a `PopoverTrigger`, the element it is placed against; inside one, a different anchor. */
    triggerRef?: RefObject<Element | null> | undefined;
    /** Leaves the page outside reachable, visible to assistive technology and scrollable. */
    isNonModal?: boolean | undefined;
    /** The heading, which also names the dialog unless `aria-label` or `aria-labelledby` is given. */
    title?: ReactNode;
    /** Names the dialog. */
    'aria-label'?: string | undefined;
    /** Names the dialog by another element. */
    'aria-labelledby'?: string | undefined;
    /** Shows a close button in the header. */
    showCloseButton?: boolean | undefined;
    /** Shows an arrow pointing at the trigger. */
    showArrow?: boolean | undefined;
    /** The body; a function receives `close`. */
    children?: ReactNode | ((renderProps: PopoverRenderProps) => ReactNode);
}
/** Opens the `Popover` among its children when its trigger, such as a `Button`, is pressed. */
export declare function PopoverTrigger({ children, ...openState }: PopoverTriggerProps): import("react").JSX.Element;
/**
 * The floating panel the library's anchored overlays share: a React Aria popover on the `dropdown`
 * layer, with an optional arrow. It adds no hooks of its own; the caller passes them.
 */
export declare function PopoverPanel({ arrowClassName, children, style, ...rest }: PopoverPanelProps): import("react").JSX.Element;
/**
 * A dialog floating against its trigger: an optional title and close button, then the body, with an
 * optional arrow. Inside a `PopoverTrigger` it opens when the trigger is pressed; otherwise `isOpen`,
 * `onOpenChange` and `triggerRef` control it. Focus moves in on open, stays inside while open and
 * returns to the trigger on close; Escape and outside presses close it.
 */
export declare function Popover({ title, showCloseButton, showArrow, offset, children, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, className, ...rest }: PopoverProps): import("react").JSX.Element;
//# sourceMappingURL=popover.d.ts.map