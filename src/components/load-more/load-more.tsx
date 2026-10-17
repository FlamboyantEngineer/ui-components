import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useInView } from '../../utils/use-in-view.js';
import {
  ActionButton,
  runPendingAction,
  type ActionButtonProps,
} from '../action-button/action-button.js';
import type { ButtonSize, ButtonVariant } from '../button/button.js';

export interface LoadMoreProps
  extends
    Pick<ActionButtonProps, 'onError' | 'isPending' | 'isDisabled' | 'pendingLabel' | 'ref'>,
    BaseProps {
  /**
   * Requests the next page. The caller owns cursors, requests and errors. When it returns a promise,
   * the control is pending until the promise settles.
   */
  onLoadMore?: (() => void | Promise<unknown>) | undefined;
  /** An authoritative count of entries left to load, shown as "(N remaining)". Omit when unknown. */
  remainingCount?: number | undefined;
  /** Names the collection after the visible text in the accessible name, e.g. "messages". */
  itemLabel?: string | undefined;
  /** The visible action text. Defaults to the provider's `loadMore` string. */
  label?: string | undefined;
  /** Emphasis. Defaults to `secondary`. */
  variant?: ButtonVariant | undefined;
  /** Block size. Defaults to `sm`. */
  size?: ButtonSize | undefined;
  /** Also request the next page whenever the control is in view and idle, for endless scrolling. */
  autoLoad?: boolean | undefined;
  /**
   * With `autoLoad`, load ahead: count the control as in view while it is within this many heights
   * of its scrolling container below the visible area, as React Aria's `scrollOffset`.
   */
  scrollOffset?: number | undefined;
}

const hooks = createHooks('load-more');

/** The visible text: the label, then the remaining count when it is a known, nonnegative number. */
function toVisibleText(
  label: string,
  remainingCount: number | undefined,
  formatRemaining: (count: number) => string,
): string {
  const remaining =
    remainingCount !== undefined && remainingCount >= 0
      ? normalizeCount(remainingCount)
      : undefined;
  return remaining === undefined ? label : `${label} (${formatRemaining(remaining)})`;
}

/**
 * Runs `onLoadMore` from a press, or each time the control comes into view, pending until it
 * settles. Staying in view never loads again on its own, so a request that adds nothing cannot
 * repeat endlessly and a failed one is retried only when the reader comes back to the control.
 */
function useLoadRequests({
  onLoadMore,
  onError,
  isPending,
  isDisabled,
  autoLoad,
  scrollOffset,
  button,
}: Pick<LoadMoreProps, 'onLoadMore' | 'onError' | 'isPending' | 'autoLoad' | 'scrollOffset'> & {
  isDisabled: boolean;
  button: HTMLButtonElement | null;
}) {
  const [internalPending, setInternalPending] = useState(false);
  const running = useRef(false);
  const pending = isPending ?? internalPending;
  const isInView = useInView(button, { enabled: Boolean(autoLoad) && !isDisabled, scrollOffset });

  const request = useCallback(() => {
    if (running.current || isDisabled || pending) return;
    void runPendingAction({
      blocked: false,
      setPending: (next) => {
        running.current = next;
        setInternalPending(next);
      },
      action: onLoadMore,
      onError,
    });
  }, [isDisabled, pending, onLoadMore, onError]);

  const latestRequest = useRef(request);
  useEffect(() => {
    latestRequest.current = request;
  }, [request]);
  useEffect(() => {
    if (isInView) latestRequest.current();
  }, [isInView]);

  return { pending, request };
}

/** One control that fetches the next page of a collection, on press or as it scrolls into view. */
export function LoadMore({
  onLoadMore,
  onError,
  isPending,
  isDisabled = false,
  autoLoad = false,
  scrollOffset,
  remainingCount,
  itemLabel,
  label,
  variant = 'secondary',
  size = 'sm',
  className,
  ref,
  ...rest
}: LoadMoreProps) {
  const strings = useUiStrings();
  const text = toVisibleText(label ?? strings.loadMore, remainingCount, strings.remainingCount);
  const collection = itemLabel?.trim();
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useMemo(() => mergeRefs(setButton, ref), [ref]);
  const { pending, request } = useLoadRequests({
    onLoadMore,
    onError,
    isPending,
    isDisabled,
    autoLoad,
    scrollOffset,
    button,
  });

  return (
    <ActionButton
      {...rest}
      ref={buttonRef}
      className={mergeClassNames(hooks.className, className)}
      type="button"
      variant={variant}
      size={size}
      isDisabled={isDisabled}
      isPending={pending}
      aria-label={collection ? `${text} ${collection}` : undefined}
      onPress={onLoadMore ? request : undefined}
    >
      {text}
    </ActionButton>
  );
}
