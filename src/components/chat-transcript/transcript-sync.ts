import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { findLastVisible, readDistanceToBottom, readOffset } from './transcript-geometry.js';
import {
  resolveMessageKey,
  type TranscriptRuntime,
  type TranscriptSettings,
  type TranscriptUi,
} from './transcript-runtime.js';

/** How long the newest message in view must stay the newest before `onRead` hears of it. */
const readDelay = 500;
/** How long scrolling must pause after Page Up or Page Down before focus follows. */
const pageSettleDelay = 150;

/** Whether at least half of an element, or of the view when the element is taller, is in view. */
function isMostlyVisible(element: Element, viewport: HTMLElement): boolean {
  const top = readOffset(element, viewport);
  const height = element.getBoundingClientRect().height;
  const visible = Math.min(top + height, viewport.clientHeight) - Math.max(top, 0);
  return visible >= Math.min(height, viewport.clientHeight) / 2;
}

/** Whether the first unread message lies wholly above the view. */
function resolveUnreadAbove(runtime: TranscriptRuntime, firstUnreadId: string | undefined) {
  const viewport = runtime.viewport.current;
  const key = resolveMessageKey(runtime, firstUnreadId);
  const index = key === undefined ? undefined : runtime.indexOf.get(key);
  if (!viewport || key === undefined || index === undefined) return false;
  const element = runtime.registry.element(key);
  if (element) return readOffset(element, viewport) + element.getBoundingClientRect().height <= 0;
  const snapshot = runtime.keeper.snapshot();
  const firstInView = snapshot ? runtime.indexOf.get(snapshot.key) : undefined;
  return firstInView !== undefined && index < firstInView;
}

/** Moves a virtualized transcript's window to where the reader is. */
function updateWindow(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const viewport = runtime.viewport.current;
  const feed = runtime.feed.current;
  if (!settings.virtualized || !viewport || !feed || !runtime.keys) return;
  const next = runtime.windowModel.range(viewport, feed, runtime.keys);
  settings.setRange((current) => (isShallowEqual(current, next) ? current : next));
}

/** Shows or hides the jump button, its count and the unread bar. */
function updateUi(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const viewport = runtime.viewport.current;
  if (!viewport) return;
  const isAway = readDistanceToBottom(viewport) > 1;
  if (!isAway) runtime.unseen.clear();
  const next: TranscriptUi = {
    isAway,
    unseenCount: runtime.unseen.size,
    isUnreadAbove: resolveUnreadAbove(runtime, settings.firstUnreadId),
  };
  settings.setUi((current) => (isShallowEqual(current, next) ? current : next));
}

/** Asks for older messages once the reader is within a view's height of the top. */
function loadOlderNearTop(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const viewport = runtime.viewport.current;
  if (!viewport) return;
  if (viewport.scrollTop > viewport.clientHeight) {
    runtime.olderRequested = false;
    return;
  }
  if (!settings.hasOlder || settings.isLoadingOlder || runtime.olderRequested) return;
  if (!settings.onLoadOlder) return;
  runtime.olderRequested = true;
  settings.onLoadOlder();
}

/** Notes a message the reader has seen; `onRead` hears of the newest once it settles. */
export function noteSeen(runtime: TranscriptRuntime, settings: TranscriptSettings, key: string) {
  const index = runtime.indexOf.get(key);
  const newest = runtime.readKey === null ? undefined : runtime.indexOf.get(runtime.readKey);
  if (!settings.onRead || index === undefined || (newest !== undefined && index <= newest)) return;
  runtime.readKey = key;
  const onRead = settings.onRead;
  clearTimeout(runtime.timers.get('read'));
  runtime.timers.set(
    'read',
    setTimeout(() => {
      runtime.timers.delete('read');
      if (runtime.readKey === null || runtime.readKey === runtime.reportedKey) return;
      runtime.reportedKey = runtime.readKey;
      onRead(runtime.registry.idFor(runtime.readKey));
    }, readDelay),
  );
}

/** Notes the newest message mostly in view as seen. */
function noteNewestInView(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const viewport = runtime.viewport.current;
  const { keys, elements } = runtime.mounted;
  if (!viewport || !settings.onRead) return;
  let index = findLastVisible(elements, viewport);
  const last = elements[index];
  if (last && !isMostlyVisible(last, viewport)) index -= 1;
  const key = keys[index];
  if (key !== undefined) noteSeen(runtime, settings, key);
}

/** Brings everything that depends on the scroll position up to date. */
export function syncWithScroll(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  updateWindow(runtime, settings);
  updateUi(runtime, settings);
  loadOlderNearTop(runtime, settings);
  noteNewestInView(runtime, settings);
}

/** After Page Up or Page Down scrolled the view natively, focuses the message now at the top. */
export function focusAfterPaging(runtime: TranscriptRuntime) {
  if (!runtime.isPaging) return;
  clearTimeout(runtime.timers.get('page'));
  runtime.timers.set(
    'page',
    setTimeout(() => {
      runtime.timers.delete('page');
      runtime.isPaging = false;
      const viewport = runtime.viewport.current;
      const snapshot = runtime.keeper.snapshot();
      if (!viewport || !snapshot) return;
      const { keys, elements } = runtime.mounted;
      const index = keys.indexOf(snapshot.key);
      const next = elements[index + 1];
      // A message cut off at the top yields to the next one when that one starts in view.
      const cutOff =
        snapshot.offset < -1 && next && readOffset(next, viewport) < viewport.clientHeight;
      elements[cutOff ? index + 1 : index]?.focus({ preventScroll: true });
    }, pageSettleDelay),
  );
}
