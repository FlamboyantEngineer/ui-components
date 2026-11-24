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

interface NearbyPageQuery {
  nearPages: ReadonlySet<number> | null;
  pageCount: number;
  view: DOMRect;
  read(pageIndex: number): PageMeasurement | undefined;
}

/**
 * The observer's near pages cover the view in the page column, with one page on each side. A fresh
 * boundary check catches a jump, layout change or a scroll heard before the observer reports.
 */
function readNearbyPages({ nearPages, pageCount, view, read }: NearbyPageQuery) {
  if (!nearPages?.size) return null;
  let first = pageCount;
  let last = -1;
  for (const pageIndex of nearPages) {
    first = Math.min(first, pageIndex);
    last = Math.max(last, pageIndex);
  }
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

/** Measures each needed page once. A stale or unavailable near set falls back to every page. */
export function measurePdfScrollPosition(
  scroller: HTMLElement,
  elements: ReadonlyMap<number, HTMLElement>,
  nearPages: ReadonlySet<number> | null,
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
  const nearby = readNearbyPages({ nearPages, pageCount: elements.size, view, read });
  return { view, ...selectPages(nearby ?? Array.from(elements.keys(), read), view) };
}
