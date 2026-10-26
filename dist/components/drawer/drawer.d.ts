import type { ReactNode } from 'react';
import type { OpenStateProps, OverlayDismissProps } from '../../core/events.js';
import type { BaseProps, Size } from '../../core/props.js';
/** A pressable trigger and the `Drawer` it opens. */
export interface DrawerTriggerProps extends OpenStateProps {
    /** The trigger (a `Button` or another pressable), then its `Drawer`. */
    children: ReactNode;
}
/** The viewport edge the drawer slides in from; `start` and `end` follow the reading direction. */
export type DrawerPosition = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';
/** The way a swipe dismisses the drawer: toward an edge, or either way along an axis. */
export type DrawerSwipeDirection = DrawerPosition | 'vertical' | 'horizontal';
/** The drawer's extent away from its edge, which the host stylesheet maps to a length. */
export type DrawerSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export interface DrawerRenderProps {
    /** Closes the drawer. */
    close: () => void;
}
export interface DrawerProps extends OpenStateProps, OverlayDismissProps, BaseProps {
    /** The edge it slides in from. Defaults to `end`. */
    position?: DrawerPosition | undefined;
    /** Defaults to `md`. */
    size?: DrawerSize | undefined;
    /** The heading, which names the dialog. */
    title: ReactNode;
    /** Shows a close button in the header. */
    showCloseButton?: boolean | undefined;
    /** Content at the bottom of the drawer, such as its actions. */
    footer?: ReactNode;
    /** The body; a function receives `close`. */
    children?: ReactNode | ((renderProps: DrawerRenderProps) => ReactNode);
    /** The direction a swipe dismisses it. Defaults to its `position`. */
    swipeDirection?: DrawerSwipeDirection | undefined;
    /**
     * Amounts of the panel left visible that it rests at, opening at the first: pixels, or
     * percentages of the panel such as `'50%'`.
     */
    snapPoints?: ReadonlyArray<number | string> | undefined;
    /** Refuses Escape, outside presses, swiping it away and the close button. */
    isDismissDisabled?: boolean | undefined;
}
/** Opens the `Drawer` among its children when its trigger, such as a `Button`, is pressed. */
export declare function DrawerTrigger({ children, ...openState }: DrawerTriggerProps): import("react").JSX.Element;
/**
 * A panel that slides in from an edge of the viewport over a page it blocks (React Aria `Sheet`):
 * a title, an optional close button, the body and a footer. Focus moves in once it has entered and
 * stays inside; Escape, an outside press and a swipe toward its edge close it, and focus returns to
 * the trigger. Snap points, swipe directions and nested drawers come from React Aria.
 */
export declare function Drawer({ position, size, title, showCloseButton, footer, children, isDismissable, isKeyboardDismissDisabled, shouldCloseOnInteractOutside, isDismissDisabled, snapPoints, id, className, ...rest }: DrawerProps): import("react").JSX.Element;
//# sourceMappingURL=drawer.d.ts.map