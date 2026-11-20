import { isHTMLElement } from '../../utils/is-element.js';
import { createValueStore, type ValueStore } from '../../utils/value-store.js';
import { readDistanceToBottom } from '../chat-transcript/transcript-geometry.js';
import { createScrollKeeper, type ScrollKeeper } from '../chat-transcript/transcript-scroll.js';
import { scrollerHooks as hooks } from './scroller-hooks.js';

export type MessageScrollerButtonDirection = 'start' | 'end';
export type MessageScrollerDefaultScrollPosition = 'start' | 'end' | 'last-anchor';

type Edges = { start: boolean; end: boolean };
type Options = {
  autoScroll: boolean;
  defaultScrollPosition: MessageScrollerDefaultScrollPosition;
};

interface Row {
  id: string;
  element: HTMLElement;
  anchor: boolean;
  streaming: boolean;
}

const noOverflow: Edges = { start: false, end: false };

function readRows(content: HTMLElement): Row[] {
  const rows: Row[] = [];
  for (const element of content.children) {
    if (!isHTMLElement(element) || !element.classList.contains(hooks.slotClass('item'))) continue;
    const { messageId, scrollAnchor, streaming } = element.dataset;
    if (messageId !== undefined) {
      rows.push({
        id: messageId,
        element,
        anchor: scrollAnchor === 'true',
        streaming: streaming === 'true',
      });
    }
  }
  return rows;
}

/** New rows through the last retained one are history or insertions. */
function readNewTail(rows: Row[], previous: Map<string, Row>): Row[] {
  const lastRetained = rows.findLastIndex(({ id }) => previous.has(id));
  if (previous.size === 0) return rows;
  return lastRetained < 0 ? [] : rows.slice(lastRetained + 1);
}

interface ScrollerState extends Options {
  viewport: HTMLElement | null;
  spacer: HTMLElement | null;
  rows: Map<string, Row>;
  keys: string[];
  elements: HTMLElement[];
  scanned: boolean;
  opened: boolean;
  openingAnchor: string | null;
  pending: Set<string>;
  announcements: Set<(count: number) => void>;
  edges: ValueStore<Edges>;
}

function publishEdges(state: ScrollerState) {
  const { viewport, edges } = state;
  const start = viewport !== null && viewport.scrollTop > 1;
  const end = viewport !== null && readDistanceToBottom(viewport) > 1;
  if (start !== edges.get().start || end !== edges.get().end) edges.set({ start, end });
}

function landAtEnd(state: ScrollerState, keeper: ScrollKeeper) {
  keeper.holdBottom();
  if (!state.autoScroll) keeper.release();
}

function settleRows(state: ScrollerState, keeper: ScrollKeeper) {
  if (state.opened) keeper.settle();
  else if (state.rows.size > 0 && state.viewport?.clientHeight) {
    state.opened = true;
    const { openingAnchor } = state;
    if (openingAnchor !== null && state.rows.get(openingAnchor)?.anchor)
      keeper.anchor(openingAnchor);
    else if (state.defaultScrollPosition === 'start') keeper.release();
    else landAtEnd(state, keeper);
  }
  publishEdges(state);
}

function announceRows(state: ScrollerState, tail: Row[]) {
  let count = 0;
  state.pending.forEach((id) => {
    const row = state.rows.get(id);
    if (!row || !row.streaming) {
      state.pending.delete(id);
      if (row) count += 1;
    }
  });
  tail.forEach(({ id, streaming }) => {
    if (streaming) state.pending.add(id);
    else count += 1;
  });
  if (count > 0) state.announcements.forEach((listener) => listener(count));
}

function syncRows(state: ScrollerState, keeper: ScrollKeeper, next: Row[]) {
  const tail = state.scanned ? readNewTail(next, state.rows) : [];
  const lastAnchor = next.findLast((row) => row.anchor);
  const newAnchor =
    lastAnchor && (tail.includes(lastAnchor) || state.rows.get(lastAnchor.id)?.anchor === false);

  state.scanned = true;
  state.rows = new Map(next.map((row) => [row.id, row]));
  state.keys = next.map((row) => row.id);
  state.elements = next.map((row) => row.element);

  const anchor = keeper.anchorKey();
  if (!state.opened) {
    if (newAnchor || state.defaultScrollPosition === 'last-anchor') {
      state.openingAnchor = lastAnchor?.id ?? null;
    }
  } else if (newAnchor) keeper.anchor(lastAnchor.id);
  else if (anchor !== null && !state.rows.get(anchor)?.anchor) keeper.anchor(null);
  settleRows(state, keeper);
  announceRows(state, tail);
}

function resetRows(state: ScrollerState, keeper: ScrollKeeper) {
  keeper.reset();
  state.scanned = false;
  state.opened = false;
  state.openingAnchor = null;
  state.rows.clear();
  state.keys = [];
  state.elements = [];
  state.pending.clear();
}

function watchContent(state: ScrollerState, keeper: ScrollKeeper, viewport: HTMLElement) {
  state.viewport = viewport;
  let content: HTMLElement | null = null;
  const resize =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          settleRows(state, keeper);
        });
  const sync = (records: MutationRecord[]) => {
    const next = viewport.querySelector<HTMLElement>(`.${hooks.slotClass('content')}`);
    if (next !== content) {
      resetRows(state, keeper);
      content = next;
      state.spacer = next?.querySelector<HTMLElement>(`.${hooks.slotClass('spacer')}`) ?? null;
      resize?.disconnect();
      resize?.observe(viewport);
      if (next) resize?.observe(next);
      if (next) syncRows(state, keeper, readRows(next));
    } else if (
      content &&
      records.some(({ target }) => target === content || target.parentElement === content)
    ) {
      syncRows(state, keeper, readRows(content));
    } else if (!resize) settleRows(state, keeper);
  };
  const mutation = new MutationObserver(sync);
  mutation.observe(viewport, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-message-id', 'data-scroll-anchor', 'data-streaming'],
    characterData: resize === null,
  });
  sync([]);
  return () => {
    mutation.disconnect();
    resize?.disconnect();
    resetRows(state, keeper);
    state.viewport = null;
    state.spacer = null;
    publishEdges(state);
  };
}

function jumpToEdge(
  state: ScrollerState,
  keeper: ScrollKeeper,
  direction: MessageScrollerButtonDirection,
) {
  const { viewport } = state;
  if (!viewport) return;
  viewport.focus({ preventScroll: true });
  keeper.anchor(null);
  if (direction === 'start') {
    viewport.scrollTop = 0;
    keeper.release();
  } else landAtEnd(state, keeper);
  publishEdges(state);
}

export function createScrollerRuntime(initial: Options) {
  const state: ScrollerState = {
    ...initial,
    viewport: null,
    spacer: null,
    rows: new Map(),
    keys: [],
    elements: [],
    scanned: false,
    opened: false,
    openingAnchor: null,
    pending: new Set(),
    announcements: new Set(),
    edges: createValueStore(noOverflow),
  };
  const keeper = createScrollKeeper(
    {
      viewport: () => state.viewport,
      spacer: () => state.spacer,
      element: (id) => state.rows.get(id)?.element ?? null,
      mounted: () => ({ keys: state.keys, elements: state.elements }),
    },
    { canFollowLiveEnd: () => state.autoScroll },
  );

  return {
    attach: (element: HTMLElement) => watchContent(state, keeper, element),
    updateOptions({ autoScroll, defaultScrollPosition }: Options) {
      state.defaultScrollPosition = defaultScrollPosition;
      if (state.autoScroll === autoScroll) return;
      state.autoScroll = autoScroll;
      if (keeper.hold() === 'anchor') return;
      if (autoScroll) keeper.classify();
      else keeper.release();
    },
    scrolled() {
      keeper.scrolled();
      publishEdges(state);
    },
    jump: (direction: MessageScrollerButtonDirection) => jumpToEdge(state, keeper, direction),
    subscribeAnnouncements(listener: (count: number) => void) {
      state.announcements.add(listener);
      return () => {
        state.announcements.delete(listener);
      };
    },
    subscribe: state.edges.subscribe,
    edges: state.edges.get,
    serverEdges: () => noOverflow,
  };
}
