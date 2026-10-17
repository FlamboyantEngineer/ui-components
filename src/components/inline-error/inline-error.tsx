import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ActionButton } from '../action-button/action-button.js';
import { Icon } from '../icon/icon.js';

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
}

const hooks = createHooks('inline-error', ['icon', 'message', 'retry']);

/** Compact feedback for a failed operation or validation, announced as an alert, with optional recovery. */
export function InlineError({
  children,
  onRetry,
  onRetryError,
  retryLabel,
  isRetryDisabled = false,
  className,
  ...rest
}: InlineErrorProps) {
  const strings = useUiStrings();
  return (
    <div
      {...rest}
      {...hooks.root({ className })}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <Icon glyph="error" className={hooks.slotClass('icon')} />
      <div {...hooks.slot('message')}>{children}</div>
      {onRetry ? (
        <ActionButton
          variant="secondary"
          size="sm"
          className={hooks.slotClass('retry')}
          isDisabled={isRetryDisabled}
          onPress={() => onRetry()}
          onError={onRetryError}
        >
          {retryLabel ?? strings.retry}
        </ActionButton>
      ) : null}
    </div>
  );
}
