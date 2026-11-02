'use client';

import { ErrorGlyph } from '../../core/glyphs.js';
import { getToneGlyph } from '../../core/tone-glyphs.js';
import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Tone, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';

/** `danger` for a failure, `warning` for a problem that does not block, `success` for a passed check. */
export type InlineErrorTone = Extract<Tone, 'danger' | 'warning' | 'success'>;

export interface InlineErrorProps
  extends BaseProps, RefProps<HTMLDivElement>, Pick<NativeProps<'div'>, 'hidden'> {
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

const hooks = createHooks('inline-error', ['icon', 'spinner', 'message', 'retry']);

/** An assertive alert for a settled failure, a polite status for everything else. */
function toLiveRegion(isUrgent: boolean) {
  return isUrgent
    ? ({ role: 'alert', 'aria-live': 'assertive' } as const)
    : ({ role: 'status', 'aria-live': 'polite' } as const);
}

/**
 * Compact feedback for a failed operation or validation, with optional recovery. A failure is an
 * assertive alert; a warning, a success or a check still running is a polite status.
 */
export function InlineError({
  children,
  onRetry,
  onRetryError,
  retryLabel,
  isRetryDisabled = false,
  tone = 'danger',
  isPending = false,
  className,
  ...rest
}: InlineErrorProps) {
  const strings = useUiStrings();
  const glyph = getToneGlyph(tone) ?? ErrorGlyph;
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { tone, pending: isPending } })}
      {...toLiveRegion(tone === 'danger' && !isPending)}
      aria-atomic="true"
    >
      {isPending ? (
        <span {...hooks.slot('spinner')} aria-hidden="true" />
      ) : (
        <Icon icon={glyph} className={hooks.slotClass('icon')} />
      )}
      <div {...hooks.slot('message')}>{children}</div>
      {onRetry ? (
        <Button
          variant="secondary"
          size="sm"
          className={hooks.slotClass('retry')}
          isDisabled={isRetryDisabled}
          onPress={() => onRetry()}
          onError={onRetryError}
        >
          {retryLabel ?? strings.retry}
        </Button>
      ) : null}
    </div>
  );
}
