import { type ReactNode, type RefObject } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import type { BaseProps, Placement } from '../../core/props.js';
export type TooltipVariant = 'default' | 'info';
export type TooltipPlacement = Placement;
/** `description` describes the trigger by the hint; `label` makes the hint the trigger's name. */
export type TooltipRelationship = 'description' | 'label';
/** Caller props for the panel. Its `id` belongs to React Aria, which describes the trigger by it. */
type TooltipPanelBaseProps = Omit<BaseProps, 'id'>;
/** What opens the tooltip: hover and keyboard focus, or keyboard focus only. */
export type TooltipTriggerType = 'hover' | 'focus';
export interface TooltipProps extends OpenStateProps, TooltipPanelBaseProps {
    /** The hint. Plain text or inline content; never interactive. */
    content: ReactNode;
    /** The trigger: a React Aria focusable such as `Button`, `Button` or `Link`. */
    children: ReactNode;
    /** Milliseconds the pointer rests on the trigger before the hint opens. Defaults to 500. */
    delay?: number | undefined;
    /** Milliseconds after the pointer leaves before the hint closes. Defaults to 500. */
    closeDelay?: number | undefined;
    /** `focus` opens the hint on keyboard focus only. Defaults to hover and focus. */
    trigger?: TooltipTriggerType | undefined;
    /** Never opens the hint. */
    isDisabled?: boolean | undefined;
    /** Whether pressing the trigger closes the hint. Defaults to true. */
    shouldCloseOnPress?: boolean | undefined;
    /** `default` for a hint on a control, `info` for a softer explanatory note. Defaults to `default`. */
    variant?: TooltipVariant | undefined;
    /** Preferred side of the trigger. Defaults to `top`; the tooltip flips when it does not fit. */
    placement?: TooltipPlacement | undefined;
    /**
     * `description` (the default) describes the trigger by the open hint. `label` makes string
     * content the trigger's accessible name, open or not, as for an icon-only control.
     */
    relationship?: TooltipRelationship | undefined;
}
/** The tooltip panel, inside a `TooltipTrigger` or driven through `TooltipTriggerStateContext`. */
export interface TooltipPanelProps extends Pick<TooltipProps, 'placement'>, TooltipPanelBaseProps {
    /** The panel's look. */
    variant: TooltipVariant;
    /** The hint. */
    children: ReactNode;
    /** For a panel driven through `TooltipTriggerStateContext`: the element it is positioned against. */
    triggerRef?: RefObject<Element | null> | undefined;
}
/** The hover delay before a tooltip opens, in milliseconds. */
export declare const TOOLTIP_DELAY = 500;
/** The tooltip panel with its hooks; inside a `TooltipTrigger` or standalone with `triggerRef`. */
export declare function TooltipPanel({ variant, children, className, placement, ...rest }: TooltipPanelProps): import("react").JSX.Element;
/**
 * A short, non-interactive hint shown when its trigger is hovered (after `delay`) or keyboard
 * focused, and dismissed on leave, blur, press or Escape. With `relationship="label"` the hint is
 * the trigger's name instead of its description.
 */
export declare function Tooltip({ content, children, variant, placement, className, delay, relationship, ...rest }: TooltipProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=tooltip.d.ts.map