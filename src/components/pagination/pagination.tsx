import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';

export interface PaginationProps extends BaseProps {
  /** The number of pages; fewer than one counts as one. */
  pageCount: number;
  /** The current page, from 1 (controlled). */
  page?: number | undefined;
  /** The page shown first while the pagination owns the page. Defaults to 1. */
  defaultPage?: number | undefined;
  /** Called with the page the reader moves to. */
  onPageChange?: ((page: number) => void) | undefined;
  /** Disables every button. */
  isDisabled?: boolean | undefined;
  /** Names the navigation. Defaults to the provider's `pagination` string. */
  'aria-label'?: string | undefined;
}

/** One entry of a page list: a page number, or a gap standing for the pages it skips. */
export type PaginationItem = number | 'start-gap' | 'end-gap';

const hooks = createHooks('pagination', ['list', 'item', 'previous', 'next', 'page', 'ellipsis']);

/** Pages always listed at each end, and on each side of the current page. */
const edgePages = 1;
const siblingPages = 1;
/** The most entries the list holds: both ends, the current page, its siblings and two gaps. */
const maxEntries = 2 * edgePages + 2 * siblingPages + 3;

function listPages(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);
}

/**
 * The entries of a page list: every page when they fit in seven entries, else the first and last
 * pages, the current page with one page on each side, and a gap wherever pages are skipped. A gap
 * that would hide a single page shows that page instead.
 */
export function getPaginationItems(page: number, pageCount: number): PaginationItem[] {
  const count = Math.max(1, Math.floor(pageCount));
  if (count <= maxEntries) return listPages(1, count);
  const current = clamp(page, 1, count);
  const lastMiddle = count - edgePages - 1;
  const start = clamp(current - siblingPages, edgePages + 2, lastMiddle - 2 * siblingPages);
  const end = clamp(current + siblingPages, edgePages + 2 * siblingPages + 2, lastMiddle);
  return [
    ...listPages(1, edgePages),
    start > edgePages + 2 ? 'start-gap' : edgePages + 1,
    ...listPages(start, end),
    end < lastMiddle ? 'end-gap' : count - edgePages,
    ...listPages(count - edgePages + 1, count),
  ];
}

/**
 * Page navigation: a `nav` landmark holding previous and next buttons around the page buttons, the
 * current one marked `aria-current="page"`, with gaps where pages are skipped. Previous and next stay
 * focusable at either end, so focus is never lost while paging with the keyboard.
 */
export function Pagination({
  pageCount,
  page,
  defaultPage = 1,
  onPageChange,
  isDisabled = false,
  'aria-label': label,
  className,
  id,
  ...rest
}: PaginationProps) {
  const strings = useUiStrings();
  const { locale, direction } = useLocale();
  const [requested, setPage] = useControllableState(page, defaultPage, onPageChange);
  const count = Math.max(1, Math.floor(pageCount));
  const current = clamp(requested, 1, count);
  const goTo = (next: number) => {
    if (next !== current) setPage(next);
  };
  const isRtl = direction === 'rtl';
  return (
    <nav
      {...hooks.root({ className, props: rest, data: { disabled: isDisabled } })}
      id={id}
      aria-label={label ?? strings.pagination}
    >
      <ul {...hooks.slot('list')}>
        <li {...hooks.slot('item')}>
          <IconButton
            className={hooks.slotClass('previous')}
            icon={isRtl ? 'chevron-right' : 'chevron-left'}
            label={strings.previousPage}
            size="sm"
            isDisabled={isDisabled || current === 1}
            focusableWhenDisabled
            onPress={() => goTo(current - 1)}
          />
        </li>
        {getPaginationItems(current, count).map((item) => (
          <li key={item} {...hooks.slot('item')}>
            {typeof item === 'number' ? (
              <Button
                className={hooks.slotClass('page')}
                variant="ghost"
                size="sm"
                isDisabled={isDisabled}
                aria-label={strings.pageNumber(item)}
                aria-current={item === current ? 'page' : undefined}
                data-current={item === current || undefined}
                onPress={() => goTo(item)}
              >
                {item.toLocaleString(locale)}
              </Button>
            ) : (
              <span {...hooks.slot('ellipsis')} aria-hidden="true">
                …
              </span>
            )}
          </li>
        ))}
        <li {...hooks.slot('item')}>
          <IconButton
            className={hooks.slotClass('next')}
            icon={isRtl ? 'chevron-left' : 'chevron-right'}
            label={strings.nextPage}
            size="sm"
            isDisabled={isDisabled || current === count}
            focusableWhenDisabled
            onPress={() => goTo(current + 1)}
          />
        </li>
      </ul>
    </nav>
  );
}
