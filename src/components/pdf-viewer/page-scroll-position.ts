interface PageMeasurement {
  pageIndex: number;
  element: HTMLElement;
  box: DOMRect;
}

/** The toolbar and the visible-position callback pick different pages from the same view. */
export interface PdfScrollPosition {
  view: DOMRect;
  mostVisible: PageMeasurement | undefined;
  atTop: PageMeasurement | undefined;
}

interface PageRangeOptions {
  nearPages: ReadonlySet<number> | null;
  pageCount: number;
}

interface PageRangeQuery extends PageRangeOptions {
  view: DOMRect;
  read(pageIndex: number): PageMeasurement | undefined;
}

/**
 * The observer's near pages cover the view in the page column, with one page on each side. A fresh
 * boundary check catches a jump, layout change or a scroll heard before the observer reports.
 */
function readNearbyPages({ nearPages, pageCount, view, read }: PageRangeQuery) {
  if (!nearPages) return null;
  let first = pageCount;
  let last = -1;
  for (const pageIndex of nearPages) {
    first = Math.min(first, pageIndex);
    last = Math.max(last, pageIndex);
  }
  if (last - first + 1 !== nearPages.size) return null;
  const before = first > 0 ? read(first - 1) : undefined;
  const after = last < pageCount - 1 ? read(last + 1) : undefined;
  if (first > 0 && (!before || before.box.bottom > view.top)) return null;
  if (last < pageCount - 1 && (!after || after.box.top < view.bottom)) return null;

  const pages: PageMeasurement[] = [];
  for (let pageIndex = first; pageIndex <= last; pageIndex++) {
    const page = read(pageIndex);
    if (!page) return null;
    pages.push(page);
  }
  // In a gap wider than the view, the top-edge report still belongs to the next page.
  if (after) pages.push(after);
  return pages;
}

/** Finds the first page crossing the top edge using the live bounds, then measures the visible run. */
function readOrderedPages({ pageCount, view, read }: PageRangeQuery) {
  let start = 0;
  let end = pageCount;
  while (start < end) {
    const middle = Math.floor((start + end) / 2);
    const page = read(middle);
    if (!page) return null;
    if (page.box.bottom > view.top) end = middle;
    else start = middle + 1;
  }

  const pages: PageMeasurement[] = [];
  // Beyond the last page, its bounds still give the top-edge position.
  for (let index = Math.min(start, pageCount - 1); index >= 0 && index < pageCount; index++) {
    const page = read(index);
    if (!page) return null;
    pages.push(page);
    if (page.box.top >= view.bottom) break;
  }
  return pages;
}

function selectPages(pages: Iterable<PageMeasurement | undefined>, view: DOMRect) {
  let mostVisible: PageMeasurement | undefined;
  let atTop: PageMeasurement | undefined;
  let last: PageMeasurement | undefined;
  let visibleHeight = 0;
  for (const page of pages) {
    if (!page) continue;
    const { pageIndex, box } = page;
    const overlap = Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top);
    if (
      overlap > visibleHeight ||
      (overlap === visibleHeight && mostVisible && pageIndex < mostVisible.pageIndex)
    ) {
      mostVisible = page;
      visibleHeight = overlap;
    }
    if (box.bottom > view.top && (!atTop || pageIndex < atTop.pageIndex)) atTop = page;
    if (!last || pageIndex > last.pageIndex) last = page;
  }
  return { mostVisible, atTop: atTop ?? last };
}

/** Measures each needed page once, even before visibility catches up after a jump. */
export function measurePdfScrollPosition(
  scroller: HTMLElement,
  elements: ReadonlyMap<number, HTMLElement>,
  options: PageRangeOptions,
): PdfScrollPosition {
  const view = scroller.getBoundingClientRect();
  const measured = new Map<number, PageMeasurement>();
  const read = (pageIndex: number) => {
    const previous = measured.get(pageIndex);
    if (previous) return previous;
    const element = elements.get(pageIndex);
    if (!element) return undefined;
    const page = { pageIndex, element, box: element.getBoundingClientRect() };
    measured.set(pageIndex, page);
    return page;
  };
  const query = { ...options, view, read };
  const pages =
    elements.size === options.pageCount
      ? (readNearbyPages(query) ?? readOrderedPages(query))
      : null;
  return { view, ...selectPages(pages ?? Array.from(elements.keys(), read), view) };
}
