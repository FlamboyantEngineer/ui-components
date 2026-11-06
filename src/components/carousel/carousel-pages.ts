// Which slides a carousel shows together, and where each move and page lands. Pure, so the pages
// and moves are the same for the buttons, the keys, the pickers and a swipe.

/** How a carousel groups its slides: how many show together and how many one move advances. */
export interface CarouselPaging {
  count: number;
  /** Slides shown together, at least 1. */
  perPage: number;
  /** Slides one move advances, at least 1. */
  perMove: number;
  loop: boolean;
}

/** A whole number from 1 up, or 1 for anything else. */
export function toSlideCount(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value >= 1 ? Math.trunc(value) : 1;
}

/** The last index a page can start at: the one whose page ends on the last slide. */
export function findLastStart({ count, perPage }: Pick<CarouselPaging, 'count' | 'perPage'>) {
  return Math.max(0, count - perPage);
}

/**
 * The index each page starts at: every `perMove` slides from the first, with the last page moved
 * back to end on the last slide, so a partial final group still fills the page.
 */
export function listPageStarts(paging: Pick<CarouselPaging, 'count' | 'perPage' | 'perMove'>) {
  const last = findLastStart(paging);
  const starts: number[] = [];
  for (let start = 0; start < last; start += paging.perMove) starts.push(start);
  starts.push(last);
  return starts;
}

/** The page holding `index`: the last page that starts at or before it. */
export function findPage(starts: readonly number[], index: number): number {
  let page = 0;
  for (const [position, start] of starts.entries()) if (start <= index) page = position;
  return page;
}

/**
 * Where one move from `index` lands, or `null` when it cannot move: `perMove` slides on, stopping
 * at the last page's start and the first slide, or wrapping from either end with `loop`.
 */
export function resolveMove(paging: CarouselPaging, index: number, delta: -1 | 1): number | null {
  const last = findLastStart(paging);
  if (last === 0) return null;
  if (delta === 1) {
    if (index < last) return Math.min(index + paging.perMove, last);
    return paging.loop ? 0 : null;
  }
  if (index > 0) return Math.max(index - paging.perMove, 0);
  return paging.loop ? last : null;
}
