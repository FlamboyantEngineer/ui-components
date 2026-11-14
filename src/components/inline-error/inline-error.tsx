'use client';

import type { ReactNode } from 'react';
import { ErrorGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getToneGlyph } from '../../core/tone-glyphs.js';
import { Button } from '../button/button.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { Spinner } from '../progress-bar/progress-bar.js';

/** `danger` for a failure, `warning` for a problem that does not block, `success` for a passed check. */
export type InlineErrorTone = Extract<Tone, 'danger' | 'warning' | 'success'>;

/** A suggested action drawn as a link after the message, such as reloading the current version. */
export interface InlineErrorAction {
  /** Identifies the action among the others. */
  id: string;
  /** The link text. */
  label: string;
  /** A glyph before the label. None by default. */
  icon?: IconSource;
  /** Runs the action. When it returns a promise, the link is pending until it settles. */
  onAction: () => void | Promise<unknown>;
  /** Receives a rejected action's error. Without it the rejection is rethrown. */
  onError?: ((error: unknown) => void) | undefined;
  /** Refuse the action while it cannot run. */
  isDisabled?: boolean | undefined;
}

export interface InlineErrorProps
  extends BaseProps, RefProps<HTMLDivElement>, Pick<NativeProps<'div'>, 'hidden'> {
  /** The failure or validation message: text, a paragraph or a list. */
  children: ReactNode;
  /** Draws a Retry link after the message. When it returns a promise, the link is pending until it settles. */
  onRetry?: (() => void | Promise<unknown>) | undefined;
  /** Receives a rejected retry's error. Without it the rejection is rethrown. */
  onRetryError?: ((error: unknown) => void) | undefined;
  /** The Retry link's label. Defaults to the provider's `retry` string. */
  retryLabel?: string | undefined;
  /** A glyph before the Retry link's label. None by default. */
  retryIcon?: IconSource;
  /** Refuse recovery while the retry cannot run. */
  isRetryDisabled?: boolean | undefined;
  /** More suggested actions, drawn as links after Retry in this order. */
  actions?: readonly InlineErrorAction[] | undefined;
  /** The outcome. Defaults to `danger`, an assertive alert; the others are polite statuses. */
  tone?: InlineErrorTone | undefined;
  /** The check is still running: a decorative spinner replaces the glyph and the message is polite. */
  isPending?: boolean | undefined;
}

const hooks = createHooks('inline-error', ['icon', 'spinner', 'message', 'retry', 'action']);

/** An assertive alert for a settled failure, a polite status for everything else. */
function toLiveRegion(isUrgent: boolean) {
  return isUrgent
    ? ({ role: 'alert', 'aria-live': 'assertive' } as const)
    : ({ role: 'status', 'aria-live': 'polite' } as const);
}

/** One suggested action: a link-styled button that flows with the message text. */
function ActionLink({
  slot,
  action: { label, icon, onAction, onError, isDisabled = false },
}: {
  slot: 'retry' | 'action';
  action: Omit<InlineErrorAction, 'id'>;
}) {
  // The space before the link is collapsed at the start of a line, so a wrapped link sits flush.
  return (
    <>
      {' '}
      <Button
        variant="link"
        size="xs"
        underline="hover"
        startIcon={icon}
        className={hooks.slotClass(slot)}
        isDisabled={isDisabled}
        onPress={() => onAction()}
        onError={onError}
      >
        {label}
      </Button>
    </>
  );
}

/**
 * Compact feedback for a failed operation or validation, with suggested actions as links right
 * after the message. A failure is an assertive alert; a warning, a success or a check still running
 * is a polite status.
 */
export function InlineError({
  children,
  onRetry,
  onRetryError,
  retryLabel,
  retryIcon,
  isRetryDisabled = false,
  actions = [],
  tone = 'danger',
  isPending = false,
  className,
  ...rest
}: InlineErrorProps) {
  const strings = useUiStrings();
  const glyph = getToneGlyph(tone) ?? ErrorGlyph;
  return (
    <div {...rest} {...hooks.root({ className, data: { tone, pending: isPending } })}>
      {isPending ? (
        <Spinner size="sm" className={hooks.slotClass('spinner')} />
      ) : (
        <Icon icon={glyph} className={hooks.slotClass('icon')} />
      )}
      {/* Only the message is the live region: the links and their progress are not read with it. */}
      <div
        {...hooks.slot('message')}
        {...toLiveRegion(tone === 'danger' && !isPending)}
        aria-atomic="true"
      >
        {children}
      </div>
      {onRetry ? (
        <ActionLink
          slot="retry"
          action={{
            label: retryLabel ?? strings.retry,
            icon: retryIcon,
            onAction: onRetry,
            onError: onRetryError,
            isDisabled: isRetryDisabled,
          }}
        />
      ) : null}
      {actions.map(({ id, ...action }) => (
        <ActionLink key={id} slot="action" action={action} />
      ))}
    </div>
  );
}
