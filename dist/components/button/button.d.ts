import type { ReactNode } from 'react';
import type { BaseProps, Size } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
import { type ButtonActionProps } from './button-action.js';
import { type ButtonStateProps } from './button-state.js';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'accent' | 'chip' | 'link' | 'bare';
export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** `label` wraps children in one label slot; `parts` lays them out directly; `sentence` lets a prose label wrap. */
export type ButtonContent = 'label' | 'parts' | 'sentence' | 'icon';
export type ButtonAlign = 'center' | 'start';
export interface ButtonProps extends ButtonStateProps, ButtonActionProps, BaseProps {
    /** Emphasis and chrome. Defaults to `secondary`. */
    variant?: ButtonVariant | undefined;
    /** Block size. Defaults to `md`. */
    size?: ButtonSize | undefined;
    /** The label, or the parts of the content with `content="parts"`. */
    children?: ReactNode;
    /** How the children are laid out. Defaults to `label`. */
    content?: ButtonContent | undefined;
    /** Where content sits on the button's width. Defaults to `center`. */
    align?: ButtonAlign | undefined;
    /** Shows an icon-only button. Name it with `label` or `aria-label`. */
    icon?: IconSource;
    /** The accessible name of an icon-only button. */
    label?: string | undefined;
    /** An icon before the label. */
    startIcon?: IconSource;
    /** An icon after the label. */
    endIcon?: IconSource;
    /** Take the full width of the container. */
    fullWidth?: boolean | undefined;
    /**
     * A hint shown in a `Tooltip` on hover and keyboard focus. A natively disabled button cannot show
     * it; use `focusableWhenDisabled` to explain why a command is unavailable.
     */
    tooltip?: ReactNode;
}
export interface ButtonSpinnerProps extends Pick<BaseProps, 'className'> {
    /** Names the busy indicator. Defaults to the provider's `loading` string. */
    label?: string | undefined;
}
/** What a button shows in its tooltip: the hint, then the keyboard shortcut. */
type ButtonHint = Pick<ButtonProps, 'tooltip' | 'shortcut'>;
/** The busy indicator of a pending button: an indeterminate progress bar React Aria announces. */
export declare function ButtonSpinner({ className, label }: ButtonSpinnerProps): import("react").JSX.Element;
/** Wraps a button in a `Tooltip` when it has a hint or a shortcut, which follows the hint. */
export declare function withTooltip(button: ReactNode, { tooltip, shortcut }: ButtonHint): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
/** A labelled command button, or a link drawn as one with `href`. */
export declare function Button({ variant, size, children, content, align, icon, label, startIcon, endIcon, fullWidth, tooltip, className, onError, pendingDelay, ...rest }: ButtonProps): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
export { toAriaButtonProps, toAriaLinkProps, useButtonSelection } from './button-state.js';
export type { ButtonRenderState } from './button-state.js';
export { runPendingAction, usePendingAction } from './button-action.js';
export { ScrollStripButton } from './scroll-strip-button.js';
//# sourceMappingURL=button.d.ts.map