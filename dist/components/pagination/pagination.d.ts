import type { BaseProps } from '../../core/props.js';
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
/**
 * The entries of a page list: every page when they fit in seven entries, else the first and last
 * pages, the current page with one page on each side, and a gap wherever pages are skipped. A gap
 * that would hide a single page shows that page instead.
 */
export declare function getPaginationItems(page: number, pageCount: number): PaginationItem[];
/**
 * Page navigation: a `nav` landmark holding previous and next buttons around the page buttons, the
 * current one marked `aria-current="page"`, with gaps where pages are skipped. Previous and next stay
 * focusable at either end, so focus is never lost while paging with the keyboard.
 */
export declare function Pagination({ pageCount, page, defaultPage, onPageChange, isDisabled, 'aria-label': label, className, id, ...rest }: PaginationProps): import("react").JSX.Element;
//# sourceMappingURL=pagination.d.ts.map