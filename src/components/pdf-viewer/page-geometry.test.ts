import { describe, expect, it } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import {
  findBoxAtPoint,
  findPageIndex,
  locateRange,
  measurePageFrame,
  toPagePoint,
  toPageRect,
} from './page-geometry.js';

function placeElement(element: HTMLElement, box: { left: number; top: number }, border = 0) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({ ...box, width: 0, height: 0 }),
  });
  Object.defineProperty(element, 'clientLeft', { value: border });
  Object.defineProperty(element, 'clientTop', { value: border });
}

function createPages() {
  const column = document.createElement('div');
  column.innerHTML =
    '<div><span role="presentation">Apple orchard</span></div>' +
    '<div><span role="presentation">Pear trees</span></div>';
  document.body.append(column);
  const [first, second] = [...column.children] as HTMLElement[];
  return { column, first: requireDefined(first), second: requireDefined(second) };
}

function selectAcross(start: Node, end: Node, rects: DOMRect[], bounds: DOMRect): Range {
  const range = document.createRange();
  range.setStart(start, 0);
  range.setEnd(end, 4);
  Object.defineProperty(range, 'getClientRects', { value: () => rects });
  Object.defineProperty(range, 'getBoundingClientRect', { value: () => bounds });
  return range;
}

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height }) as DOMRect;

describe('page geometry', () => {
  it('UIC-PDF-VIEWER-7.4 converts client positions to page points inside the page border', () => {
    const page = document.createElement('div');
    placeElement(page, { left: 40, top: -125 }, 2);
    const frame = measurePageFrame(page, 1.5);
    expect(frame).toEqual({ origin: { left: 42, top: -123 }, scale: 1.5 });
    expect(toPagePoint({ left: 99, top: 27 }, frame)).toEqual({ left: 38, top: 100 });
    expect(toPageRect(rect(99, 27, 150, 18), frame)).toEqual({
      left: 38,
      top: 100,
      width: 100,
      height: 12,
    });
    // Scrolling moves the page and the pointer alike.
    const scrolled = { origin: { left: -258, top: -1023 }, scale: 1.5 };
    expect(toPageRect(rect(-201, -873, 150, 18), scrolled)).toEqual(
      toPageRect(rect(99, 27, 150, 18), frame),
    );
    expect(toPagePoint({ left: 10, top: 10 }, { origin: { left: 0, top: 0 }, scale: 0 })).toEqual({
      left: 10,
      top: 10,
    });
  });

  it('UIC-PDF-VIEWER-7.4 finds the page of a node by the page elements themselves', () => {
    const { column, first, second } = createPages();
    const pages = new Map([
      [0, first],
      [1, second],
    ]);
    expect(findPageIndex(requireDefined(second.querySelector('span')).firstChild, pages)).toBe(1);
    expect(findPageIndex(first, pages)).toBe(0);
    expect(findPageIndex(column, pages)).toBe(-1);
    expect(findPageIndex(null, pages)).toBe(-1);
    // A lookalike that is not one of the current page elements is on no page.
    const lookalike = first.cloneNode(true);
    expect(findPageIndex(lookalike.firstChild, pages)).toBe(-1);
    column.remove();
  });

  it('UIC-PDF-VIEWER-7.4 locates a selection at its first line on the page where it starts', () => {
    const { column, first, second } = createPages();
    placeElement(first, { left: 20, top: 30 }, 2);
    const pages = new Map([
      [0, first],
      [1, second],
    ]);
    const start = requireDefined(requireDefined(first.querySelector('span')).firstChild);
    const end = requireDefined(requireDefined(second.querySelector('span')).firstChild);
    const bounds = rect(10, 50, 200, 900);
    const range = selectAcross(start, end, [rect(40, 50, 100, 12), bounds], bounds);
    expect(locateRange(range, pages, 2)).toEqual({
      pageIndex: 0,
      rect: { left: 9, top: 9, width: 50, height: 6 },
    });
    const unlined = selectAcross(start, end, [], bounds);
    expect(locateRange(unlined, pages, 1)?.rect).toEqual({
      left: -12,
      top: 18,
      width: 200,
      height: 900,
    });
    const offPage = selectAcross(column, end, [], bounds);
    expect(locateRange(offPage, pages, 1)).toBeNull();
    column.remove();
  });

  it('UIC-PDF-VIEWER-7.4 hit-tests boxes topmost first with their edges included', () => {
    const boxes = [
      { key: 'under', left: 10, top: 20, width: 80, height: 30 },
      { key: 'over', left: 10, top: 20, width: 80, height: 30 },
      { key: 'beside', left: 200, top: 20, width: 10, height: 10 },
    ];
    expect(findBoxAtPoint(boxes, { left: 30, top: 21 })?.key).toBe('over');
    expect(findBoxAtPoint(boxes, { left: 90, top: 50 })?.key).toBe('over');
    expect(findBoxAtPoint(boxes, { left: 90.1, top: 50 })).toBeUndefined();
    expect(findBoxAtPoint(boxes.slice(0, 1), { left: 10, top: 20 })?.key).toBe('under');
    expect(findBoxAtPoint([], { left: 30, top: 21 })).toBeUndefined();
  });
});
