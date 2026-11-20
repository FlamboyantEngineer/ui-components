import {
  findFirstVisible,
  readDistanceToBottom,
  readOffset,
  readViewportPadding,
  resolveReveal,
  resolveTopAlignment,
  type RevealAlignment,
} from './transcript-geometry.js';

/**
 * How far the scroll position may sit from where the keeper left it and still count as the
 * keeper's own, in pixels: under half a pixel is rounding, while a whole pixel is already a reader
 * scrolling slowly, one pixel an event, as a precision touchpad or a dragged scrollbar does.
 */
const ownScrollTolerance = 0.5;

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

interface ScrollKeeperOptions {
  /** Opts into lightweight scroller semantics. Returns whether to follow from the live edge. */
  canFollowLiveEnd?: (() => boolean) | undefined;
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
  /** Lets the reader's position stand, even when it coincides with an edge. */
  release(): void;
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
): { top: number; reserve: number } | null {
  const element = anchorKey === null ? null : sources.element(anchorKey);
  const spacer = sources.spacer();
  if (!element) return null;
  const top = resolveTopAlignment(element, viewport);
  if (!spacer) return { top, reserve: 0 };
  const spacerTop = viewport.scrollTop + readOffset(spacer, viewport);
  const end = spacerTop + readViewportPadding(viewport).bottom;
  const reserve = top + viewport.clientHeight - end;
  resizeSpacer(sources, Math.max(0, Math.ceil(reserve)));
  return { top, reserve };
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

interface KeeperPosition {
  hold: TranscriptHold;
  anchorKey: string | null;
  snapshot: ScrollSnapshot | null;
  anchorReserve: number | null;
  /** Where the keeper last left the viewport, to distinguish late events from reader movement. */
  known: number | null;
  knownHeight: number;
}

function initialPosition(): KeeperPosition {
  return {
    hold: 'bottom',
    anchorKey: null,
    snapshot: null,
    anchorReserve: null,
    known: null,
    knownHeight: 0,
  };
}

function remember(position: KeeperPosition, viewport: HTMLElement) {
  position.known = viewport.scrollTop;
  position.knownHeight = viewport.clientHeight;
}

function classifyPosition(
  position: KeeperPosition,
  sources: ScrollKeeperSources,
  canFollowLiveEnd: ScrollKeeperOptions['canFollowLiveEnd'],
) {
  const viewport = sources.viewport();
  if (!viewport) return;
  position.hold = canFollowLiveEnd
    ? canFollowLiveEnd() && readDistanceToBottom(viewport) < ownScrollTolerance
      ? 'bottom'
      : 'free'
    : resolveHold(sources, viewport, { anchorKey: position.anchorKey, current: position.hold });
  position.snapshot = readSnapshot(sources, viewport);
  remember(position, viewport);
}

function updateAnchorReserve(
  position: KeeperPosition,
  reserve: number,
  canFollowLiveEnd: ScrollKeeperOptions['canFollowLiveEnd'],
) {
  // The first settle shows the prompt even if the turn already fills the viewport.
  if (
    canFollowLiveEnd?.() &&
    position.anchorReserve !== null &&
    reserve <= 0 &&
    reserve < position.anchorReserve
  ) {
    position.hold = 'bottom';
    position.anchorKey = null;
  }
  position.anchorReserve = reserve;
}

function settlePosition(
  position: KeeperPosition,
  sources: ScrollKeeperSources,
  canFollowLiveEnd: ScrollKeeperOptions['canFollowLiveEnd'],
) {
  const viewport = sources.viewport();
  if (!viewport) return;
  const { known } = position;
  // A reader who scrolled before their event arrived owns the position. A clamp is layout.
  if (
    known !== null &&
    Math.abs(viewport.scrollTop - known) >= ownScrollTolerance &&
    !isClamped(viewport, known)
  ) {
    classifyPosition(position, sources, canFollowLiveEnd);
  }
  const anchor = fitSpacer(sources, viewport, position.anchorKey);
  if (anchor && position.hold === 'anchor') {
    updateAnchorReserve(position, anchor.reserve, canFollowLiveEnd);
  }
  if (position.hold === 'bottom') viewport.scrollTop = viewport.scrollHeight;
  else if (position.hold === 'anchor' && anchor) viewport.scrollTop = anchor.top;
  else restoreSnapshot(sources, viewport, position.snapshot);
  const next = readSnapshot(sources, viewport);
  // Keep the original offset so individually subpixel shifts cannot accumulate.
  if (position.hold !== 'free' || !next || next.key !== position.snapshot?.key) {
    position.snapshot = next;
  }
  remember(position, viewport);
}

/** Holds the latest edge, a turn anchor, or the first visible message as the transcript changes. */
export function createScrollKeeper(
  sources: ScrollKeeperSources,
  { canFollowLiveEnd }: ScrollKeeperOptions = {},
): ScrollKeeper {
  let position = initialPosition();
  const classify = () => classifyPosition(position, sources, canFollowLiveEnd);
  const settle = () => settlePosition(position, sources, canFollowLiveEnd);

  return {
    hold: () => position.hold,
    anchorKey: () => position.anchorKey,
    snapshot: () => position.snapshot,
    settle,
    classify,
    scrolled() {
      const viewport = sources.viewport();
      const { known, knownHeight, hold } = position;
      if (!viewport || known === null) return classify();
      const top = viewport.scrollTop;
      if (
        !canFollowLiveEnd &&
        top < known &&
        hold !== 'free' &&
        viewport.clientHeight !== knownHeight
      )
        position.known = top;
      if (
        Math.abs(top - (position.known ?? top)) < ownScrollTolerance ||
        (canFollowLiveEnd && isClamped(viewport, known))
      )
        settle();
      else classify();
    },
    holdBottom() {
      position.hold = 'bottom';
      settle();
    },
    release() {
      const viewport = sources.viewport();
      if (!viewport) return;
      position.hold = 'free';
      position.snapshot = readSnapshot(sources, viewport);
      remember(position, viewport);
    },
    anchor(key) {
      position.anchorKey = key;
      position.anchorReserve = null;
      if (key !== null) position.hold = 'anchor';
      else if (position.hold === 'anchor') position.hold = 'bottom';
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
      position = initialPosition();
      resizeSpacer(sources, 0);
    },
  };
}
