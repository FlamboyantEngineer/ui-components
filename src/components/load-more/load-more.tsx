import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { ActionButton, type ActionButtonProps } from '../action-button/action-button.js';
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

/** One control that fetches the next page of a collection. */
export function LoadMore({
  onLoadMore,
  remainingCount,
  itemLabel,
  label,
  variant = 'secondary',
  size = 'sm',
  className,
  ...rest
}: LoadMoreProps) {
  const strings = useUiStrings();
  const text = toVisibleText(label ?? strings.loadMore, remainingCount, strings.remainingCount);
  const collection = itemLabel?.trim();

  return (
    <ActionButton
      {...rest}
      className={mergeClassNames(hooks.className, className)}
      type="button"
      variant={variant}
      size={size}
      aria-label={collection ? `${text} ${collection}` : undefined}
      onPress={onLoadMore ? () => onLoadMore() : undefined}
    >
      {text}
    </ActionButton>
  );
}
