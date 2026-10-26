import type { PressEvent } from '../../core/events.js';
import type { ElementRender } from '../../utils/render-element.js';
import type { ButtonProps, ButtonRenderState } from './button.js';
/** The pending lifecycle shared by buttons and controls that run work. */
export interface ButtonActionProps {
    /** Receives a failed action; without it the error is rethrown. */
    onError?: ((error: unknown) => void) | undefined;
    /** Milliseconds before showing pending, while repeat presses are already refused. Defaults to zero. */
    pendingDelay?: number | undefined;
}
type PendingAction = (() => unknown) | undefined;
/**
 * Runs `action` unless `blocked`, keeping `setPending(true)` until it settles. Resolves to whether the
 * action ran. A rejection reaches `onError`, or is rethrown.
 */
export declare function runPendingAction(options: {
    blocked: boolean;
    setPending: (pending: boolean) => void;
    action?: PendingAction;
    onError?: ((error: unknown) => void) | undefined;
}): Promise<boolean>;
/**
 * The pending lifecycle of a control that runs actions: `pending` is the caller's `isPending`, else
 * whether an action the control started is unsettled. `run` starts an action unless the control is
 * disabled or pending, and `isBusy` says, ahead of the next render, whether one is still running.
 */
export declare function usePendingAction({ isPending, isDisabled, onError, }: Pick<ButtonProps, 'isPending' | 'onError'> & {
    isDisabled: boolean;
}): {
    pending: boolean;
    run: (action: PendingAction) => void;
    isBusy: () => boolean;
};
/** Runs a promise-returning press and keeps native submit activation guarded while it settles. */
export declare function useButtonAction({ onPress, onError, isPending, isDisabled, pendingDelay, type, render, href, }: ButtonProps): {
    onPress: ((event: PressEvent) => unknown) | undefined;
    isPending: boolean;
    render: ElementRender<"button", ButtonRenderState> | undefined;
};
export {};
//# sourceMappingURL=button-action.d.ts.map