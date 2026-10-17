import type { Ref } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { ActionButton } from '../action-button/action-button.js';
import type { ButtonSize, ButtonVariant } from '../button/button.js';

export interface LoadMoreProps {
  /**
   * Requests the next page. The caller owns cursors, requests and errors. When it returns a promise,
   * the control is pending until the promise settles.
   */
  onLoadMore?: (() => void | Promise<unknown>) | undefined;
  /** Receives a rejected request's error. Without it the rejection is rethrown. */
  onError?: ((error: unknown) => void) | undefined;
  /** A request is in flight: presses are refused and focus stays on the control. */
  isPending?: boolean | undefined;
  /** Nothing more can be loaded now. Stays disabled whatever the pending state. */
  isDisabled?: boolean | undefined;
  /** An authoritative count of entries left to load, shown as "(N remaining)". Omit when unknown. */
  remainingCount?: number | undefined;
  /** Names the collection after the visible text in the accessible name, e.g. "messages". */
  itemLabel?: string | undefined;
  /** The visible action text. Defaults to the provider's `loadMore` string. */
  label?: string | undefined;
  /** Defaults to `secondary`. */
  variant?: ButtonVariant | undefined;
  /** Defaults to `sm`. */
  size?: ButtonSize | undefined;
  /** Names the busy indicator while pending. Defaults to the provider's `loading` string. */
  pendingLabel?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('load-more');

/** One control that fetches the next page of a collection. */
export function LoadMore({
  onLoadMore,
  onError,
  isPending,
  isDisabled = false,
  remainingCount,
  itemLabel,
  label,
  variant = 'secondary',
  size = 'sm',
  pendingLabel,
  id,
  className,
  ref,
  ...rest
}: LoadMoreProps) {
  const strings = useUiStrings();
  const remaining =
    remainingCount !== undefined && remainingCount >= 0
      ? normalizeCount(remainingCount)
      : undefined;
  const visible = [label ?? strings.loadMore];
  if (remaining !== undefined) visible.push(`(${strings.remainingCount(remaining)})`);
  const text = visible.join(' ');
  const collection = itemLabel?.trim();

  return (
    <ActionButton
      {...hooks.root({ className, props: rest })}
      id={id}
      ref={ref}
      type="button"
      variant={variant}
      size={size}
      isPending={isPending}
      isDisabled={isDisabled}
      pendingLabel={pendingLabel}
      aria-label={collection ? `${text} ${collection}` : undefined}
      onPress={onLoadMore ? () => onLoadMore() : undefined}
      onError={onError}
    >
      {text}
    </ActionButton>
  );
}
