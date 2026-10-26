import type { ReactNode } from 'react';
import type { BaseProps, NativeProps, Tone } from '../../core/props.js';
/** `danger` for a failure, `warning` for a problem that does not block, `success` for a passed check. */
export type InlineErrorTone = Extract<Tone, 'danger' | 'warning' | 'success'>;
export interface InlineErrorProps extends BaseProps, Pick<NativeProps<'div'>, 'hidden'> {
    /** The failure or validation message: text, a paragraph or a list. */
    children: ReactNode;
    /** Draws a recovery button. When it returns a promise, the button is pending until it settles. */
    onRetry?: (() => void | Promise<unknown>) | undefined;
    /** Receives a rejected retry's error. Without it the rejection is rethrown. */
    onRetryError?: ((error: unknown) => void) | undefined;
    /** The recovery button's label. Defaults to the provider's `retry` string. */
    retryLabel?: string | undefined;
    /** Refuse recovery while the retry cannot run. */
    isRetryDisabled?: boolean | undefined;
    /** The outcome. Defaults to `danger`, an assertive alert; the others are polite statuses. */
    tone?: InlineErrorTone | undefined;
    /** The check is still running: a decorative spinner replaces the glyph and the message is polite. */
    isPending?: boolean | undefined;
}
/**
 * Compact feedback for a failed operation or validation, with optional recovery. A failure is an
 * assertive alert; a warning, a success or a check still running is a polite status.
 */
export declare function InlineError({ children, onRetry, onRetryError, retryLabel, isRetryDisabled, tone, isPending, className, ...rest }: InlineErrorProps): import("react").JSX.Element;
//# sourceMappingURL=inline-error.d.ts.map