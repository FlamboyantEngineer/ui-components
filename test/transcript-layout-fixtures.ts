// A small vertical layout for transcript tests: jsdom computes no geometry, so the scroll viewport,
// the blocks in it and their rectangles are derived here from the markup.

import { fireEvent } from '@testing-library/react';

/** The sizes the fake layout gives the transcript's parts, in pixels. Tests change them freely. */
export interface TranscriptLayout {
  /** The scroll viewport's visible height. */
  viewportHeight: number;
  /** Every message's height, unless `heights` names its id. */
  messageHeight: number;
  /** Message heights by the message's id. */
  heights: Map<string, number>;
  /** The height of the indicator shown while older messages load. */
  historyHeight: number;
  /** The height of any other element holding only text, such as a separator. */
  textHeight: number;
}

const VIEWPORT = 'ui-scroll-region__viewport';
const scrollTops = new WeakMap<Element, number>();
const patched = ['clientHeight', 'scrollHeight', 'scrollTop'] as const;
let layout: TranscriptLayout | null = null;

function current(): TranscriptLayout {
  if (!layout) throw new Error('installTranscriptLayout() first');
  return layout;
}

/** An element's block height: its inline height, a message's or the viewport's size, or its children's sum. */
function heightOf(element: Element): number {
  const sizes = current();
  const inline = element instanceof HTMLElement ? element.style.height : '';
  if (inline) return Number.parseFloat(inline) || 0;
  if (element.tagName === 'ARTICLE') return sizes.heights.get(element.id) ?? sizes.messageHeight;
  if (element.classList.contains(VIEWPORT)) return sizes.viewportHeight;
  if (element.classList.contains('ui-chat-transcript__history')) return sizes.historyHeight;
  if (element.children.length === 0) return element.textContent ? sizes.textHeight : 0;
  let sum = 0;
  for (const child of element.children) sum += heightOf(child);
  return sum;
}

function contentHeight(viewport: Element): number {
  let sum = 0;
  for (const child of viewport.children) sum += heightOf(child);
  return sum;
}

/** Where an element starts inside its viewport's content, or `null` outside a viewport. */
function contentTop(element: Element): { top: number; viewport: Element } | null {
  let top = 0;
  let node: Element | null = element;
  while (node && !node.classList.contains(VIEWPORT)) {
    for (
      let sibling = node.previousElementSibling;
      sibling;
      sibling = sibling.previousElementSibling
    ) {
      top += heightOf(sibling);
    }
    node = node.parentElement;
  }
  return node ? { top, viewport: node } : null;
}

function rect(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    left: 0,
    right: 0,
    bottom: top + height,
    width: 0,
    height,
    toJSON: () => ({}),
  };
}

function readScrollTop(element: Element): number {
  return scrollTops.get(element) ?? 0;
}

/** Installs the fake layout on the element prototypes; undo it with `uninstallTranscriptLayout`. */
export function installTranscriptLayout(sizes: Partial<TranscriptLayout> = {}): TranscriptLayout {
  layout = {
    viewportHeight: 200,
    messageHeight: 50,
    heights: new Map(),
    historyHeight: 30,
    textHeight: 20,
    ...sizes,
  };
  const isViewport = (element: Element) => element.classList.contains(VIEWPORT);
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isViewport(this) ? current().viewportHeight : heightOf(this);
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isViewport(this)
        ? Math.max(current().viewportHeight, contentHeight(this))
        : heightOf(this);
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get(this: HTMLElement) {
      // A viewport whose content shrank scrolls back within its range, as a browser's does.
      if (!isViewport(this)) return 0;
      return Math.min(readScrollTop(this), Math.max(0, this.scrollHeight - this.clientHeight));
    },
    set(this: HTMLElement, value: number) {
      if (!isViewport(this)) return;
      const range = Math.max(0, this.scrollHeight - this.clientHeight);
      scrollTops.set(this, Math.min(Math.max(0, Math.round(value)), range));
    },
  });
  Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
    if (isViewport(this)) return rect(0, current().viewportHeight);
    const position = contentTop(this);
    if (!position) return rect(0, 0);
    return rect(position.top - (position.viewport as HTMLElement).scrollTop, heightOf(this));
  };
  return layout;
}

const originalRect = Element.prototype.getBoundingClientRect;

export function uninstallTranscriptLayout() {
  for (const key of patched) Reflect.deleteProperty(HTMLElement.prototype, key);
  Element.prototype.getBoundingClientRect = originalRect;
  layout = null;
}

/** The transcript's scroll viewport. */
export function getViewport(container: Element = document.body): HTMLElement {
  const viewport = container.querySelector<HTMLElement>(`.ui-chat-transcript .${VIEWPORT}`);
  if (!viewport) throw new Error('No transcript viewport');
  return viewport;
}

/** Scrolls the viewport as a reader would, firing the scroll event. */
export function scrollViewport(viewport: HTMLElement, top: number) {
  viewport.scrollTop = top;
  fireEvent.scroll(viewport);
}

/** How far the viewport is from its bottom. */
export function distanceToBottom(viewport: HTMLElement): number {
  return viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
}

/** Where an element's top sits below the viewport's top. */
export function offsetInViewport(element: Element): number {
  return element.getBoundingClientRect().top;
}
