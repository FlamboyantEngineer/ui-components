import {
  findFirstVisible,
  readDistanceToBottom,
  readOffset,
  readViewportPadding,
  resolveReveal,
  resolveTopAlignment,
  type RevealAlignment,
} from './transcript-geometry.js';

/** Where the view is held: at the bottom, on the anchored message, or where the reader left it. */
type TranscriptHold = 'bottom' | 'anchor' | 'free';

/** The first message in view and how far below the viewport's top it sits. */
interface ScrollSnapshot {
  key: string;
  offset: number;
}

/** The elements the keeper measures, read when it needs them. */
interface ScrollKeeperSources {
  viewport(): HTMLElement | null;
  spacer(): HTMLElement | null;
  element(key: string): HTMLElement | null;
  /** The mounted messages, oldest first. */
  mounted(): { keys: readonly string[]; elements: readonly HTMLElement[] };
}

/** Keeps the transcript's scroll position where the reader expects it as content changes. */
export interface ScrollKeeper {
  hold(): TranscriptHold;
  anchorKey(): string | null;
  /** The first message in view, as last read. */
  snapshot(): ScrollSnapshot | null;
  /** Re-applies the hold after the content or the viewport changed. */
  settle(): void;
  /** Reads the hold back from the scroll position after the reader or the keeper scrolled. */
  classify(): void;
  /**
   * Handles a scroll event. One that finds the view where the keeper last left it is the keeper's
   * own scroll, heard late: content may have grown since, so the hold is applied again rather than
   * read back from a view that no longer sits at the bottom. So is one that finds the view higher
   * while the hold is not free and the viewport has changed height since: the browser clamped the
   * position as the viewport grew for a moment, the composer below it shrinking, and the composer
   * grew again before the event arrived. Content that streams in never counts, so a reader who
   * scrolls up while a reply grows still stops the following. Any other is the reader's, or the host's, and
   * moves the hold.
   */
  scrolled(): void;
  /** Holds the view at the bottom, following new content. */
  holdBottom(): void;
  /** Anchors a message at the top of the view while what follows it fills in below. */
  anchor(key: string | null): void;
  /** Scrolls an element into view and holds the view where that leaves it. */
  reveal(element: Element, align: RevealAlignment): void;
  /** Starts over at the bottom, for another conversation. */
  reset(): void;
}

function readSnapshot(sources: ScrollKeeperSources, viewport: HTMLElement): ScrollSnapshot | null {
  const { keys, elements } = sources.mounted();
  const index = findFirstVisible(elements, viewport);
  const key = keys[index];
  const element = elements[index];
  return key === undefined || !element ? null : { key, offset: readOffset(element, viewport) };
}

function resizeSpacer(sources: ScrollKeeperSources, height: number) {
  const spacer = sources.spacer();
  if (spacer && Math.abs((Number.parseFloat(spacer.style.height) || 0) - height) >= 1) {
    spacer.style.height = `${height}px`;
  }
}

/** Sizes the spacer so the anchored message can reach the top; returns that scroll position. */
function fitSpacer(
  sources: ScrollKeeperSources,
  viewport: HTMLElement,
  anchorKey: string | null,
): number | null {
  const element = anchorKey === null ? null : sources.element(anchorKey);
  const spacer = sources.spacer();
  if (!element) return null;
  const top = resolveTopAlignment(element, viewport);
  if (spacer) {
    const spacerTop = viewport.scrollTop + readOffset(spacer, viewport);
    const end = spacerTop + readViewportPadding(viewport).bottom;
    resizeSpacer(sources, Math.max(0, Math.ceil(top + viewport.clientHeight - end)));
  }
  return top;
}

/**
 * Where the scroll position holds the view: on the anchored message, at the bottom, or free. A
 * view at both the anchor and the bottom, as while a short reply fills in below the anchor, keeps
 * the anchor only while it still holds there: a reader who came back to the bottom, by scrolling or
 * Jump to latest, follows the latest message from then on.
 */
function resolveHold(
  sources: ScrollKeeperSources,
  viewport: HTMLElement,
  { anchorKey, current }: { anchorKey: string | null; current: TranscriptHold },
): TranscriptHold {
  const element = anchorKey === null ? null : sources.element(anchorKey);
  const isAtBottom = readDistanceToBottom(viewport) <= 1;
  const isAtAnchor =
    element !== null && Math.abs(resolveTopAlignment(element, viewport) - viewport.scrollTop) <= 1;
  if (isAtAnchor && (current === 'anchor' || !isAtBottom)) return 'anchor';
  return isAtBottom ? 'bottom' : 'free';
}

/**
 * Whether the scroll position moved because the browser clamped it to a scroll range that shrank,
 * as when the viewport or the content resizes, rather than because the reader scrolled: it moved
 * up, and only as far as the new bottom. A reader scrolling up never stops exactly there.
 */
function isClamped(viewport: HTMLElement, known: number): boolean {
  return viewport.scrollTop < known && readDistanceToBottom(viewport) <= 1;
}

/** Scrolls so the message that was first in view sits where it was. */
function restoreSnapshot(
  sources: ScrollKeeperSources,
  viewport: HTMLElement,
  snapshot: ScrollSnapshot | null,
) {
  const element = snapshot ? sources.element(snapshot.key) : null;
  if (!snapshot || !element) return;
  const delta = readOffset(element, viewport) - snapshot.offset;
  if (Math.abs(delta) >= 0.5) viewport.scrollTop += delta;
}

/**
 * Creates the keeper. Held at the bottom it follows new content; anchored, it keeps the anchored
 * message at the top, sizing the spacer after the messages so the scroll range reaches that far;
 * left free, it keeps the first message in view where it was, so content added or resized above
 * (older history, a message that grew) never moves what the reader is looking at.
 */
export function createScrollKeeper(sources: ScrollKeeperSources): ScrollKeeper {
  let hold: TranscriptHold = 'bottom';
  let anchorKey: string | null = null;
  let snapshot: ScrollSnapshot | null = null;
  // Where the keeper last left the scroll position, to notice a scroll it has not heard of yet, and
  // the viewport's height then.
  let known: number | null = null;
  let knownHeight = 0;
  const remember = (viewport: HTMLElement) => {
    known = viewport.scrollTop;
    knownHeight = viewport.clientHeight;
  };

  const classify = () => {
    const viewport = sources.viewport();
    if (!viewport) return;
    hold = resolveHold(sources, viewport, { anchorKey, current: hold });
    snapshot = readSnapshot(sources, viewport);
    remember(viewport);
  };

  const settle = () => {
    const viewport = sources.viewport();
    if (!viewport) return;
    // The reader scrolled before the scroll event arrived: their position wins over the hold. A
    // position the browser clamped as the scroll range shrank is layout, not the reader.
    if (known !== null && Math.abs(viewport.scrollTop - known) > 1 && !isClamped(viewport, known)) {
      classify();
    }
    const anchorTop = fitSpacer(sources, viewport, anchorKey);
    if (hold === 'bottom') viewport.scrollTop = viewport.scrollHeight;
    else if (hold === 'anchor' && anchorTop !== null) viewport.scrollTop = anchorTop;
    else restoreSnapshot(sources, viewport, snapshot);
    // Held free on the same message, the place stays where the reader left it, so shifts too small
    // to correct one at a time cannot add up to a visible one.
    const next = readSnapshot(sources, viewport);
    snapshot = hold === 'free' && next && next.key === snapshot?.key ? snapshot : next;
    remember(viewport);
  };

  return {
    hold: () => hold,
    anchorKey: () => anchorKey,
    snapshot: () => snapshot,
    settle,
    classify,
    scrolled() {
      const viewport = sources.viewport();
      if (!viewport || known === null) return classify();
      const top = viewport.scrollTop;
      const isResized = viewport.clientHeight !== knownHeight;
      if (top < known && hold !== 'free' && isResized) known = top;
      if (Math.abs(top - known) <= 1) settle();
      else classify();
    },
    holdBottom() {
      hold = 'bottom';
      settle();
    },
    anchor(key) {
      anchorKey = key;
      if (key !== null) hold = 'anchor';
      else if (hold === 'anchor') hold = 'bottom';
      if (key === null) resizeSpacer(sources, 0);
      settle();
    },
    reveal(element, align) {
      const viewport = sources.viewport();
      if (!viewport) return;
      viewport.scrollTop = resolveReveal(element, viewport, align);
      classify();
    },
    reset() {
      hold = 'bottom';
      anchorKey = null;
      snapshot = null;
      known = null;
      resizeSpacer(sources, 0);
    },
  };
}
