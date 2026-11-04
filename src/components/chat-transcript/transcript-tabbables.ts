import { isElement, isHTMLElement } from '../../utils/is-element.js';
import { tabbableSelector } from '../../utils/tabbable.js';
import type { TranscriptRegistry } from './transcript-registry.js';

/** A message's element and key. */
export interface TranscriptOwner {
  key: string;
  element: HTMLElement;
}

/** Keeps the controls inside messages out of the tab order, except in the message entered. */
export interface TabbablesManager {
  /** The message whose controls are in the tab order. */
  entered(): string | null;
  /** Puts one message's controls in the tab order and takes the previous one's out. */
  enter(key: string | null): void;
  /** Takes every mounted message's controls out of the tab order, then keeps up with changes. */
  observe(feed: HTMLElement): () => void;
}

/** The message an element sits in (or is), searching up to the feed. */
export function findOwner(
  node: Element | null,
  feed: Element,
  registry: TranscriptRegistry,
): TranscriptOwner | null {
  for (let current = node; current && current !== feed; current = current.parentElement) {
    const key = registry.keyOf(current);
    if (key !== undefined && isHTMLElement(current)) return { key, element: current };
  }
  return null;
}

/**
 * Creates the manager. Each control it takes out of the tab order keeps its own `tabindex`, which
 * comes back when the reader enters the message; a control that renders or changes its `tabindex`
 * later is taken out again, so the transcript stays one tab stop.
 */
export function createTabbablesManager(registry: TranscriptRegistry): TabbablesManager {
  const saved = new WeakMap<Element, string | null>();
  let entered: string | null = null;

  const disableOne = (element: Element) => {
    const value = element.getAttribute('tabindex');
    if (value === '-1') return;
    saved.set(element, value);
    element.setAttribute('tabindex', '-1');
  };
  const disable = (root: Element) => {
    for (const element of root.querySelectorAll(tabbableSelector)) disableOne(element);
  };
  const enable = (root: Element) => {
    for (const element of root.querySelectorAll(tabbableSelector)) {
      if (!saved.has(element)) continue;
      const value = saved.get(element) ?? null;
      saved.delete(element);
      if (value === null) element.removeAttribute('tabindex');
      else element.setAttribute('tabindex', value);
    }
  };
  const withMessage = (key: string | null, act: (element: HTMLElement) => void) => {
    const element = key === null ? null : registry.element(key);
    if (element) act(element);
  };

  const onMutation = (feed: Element, record: MutationRecord) => {
    const nodes = record.type === 'attributes' ? [record.target] : [...record.addedNodes];
    for (const node of nodes) {
      if (!isElement(node)) continue;
      const owner = findOwner(node, feed, registry);
      if (!owner || owner.key === entered) continue;
      if (node !== owner.element && node.matches(tabbableSelector)) disableOne(node);
      if (record.type === 'childList') disable(node);
    }
  };

  return {
    entered: () => entered,
    enter(key) {
      if (key === entered) return;
      withMessage(entered, disable);
      entered = key;
      withMessage(key, enable);
    },
    observe(feed) {
      for (const child of feed.children) {
        const owner = findOwner(child, feed, registry);
        if (owner && owner.key !== entered) disable(owner.element);
      }
      const view = feed.ownerDocument.defaultView;
      if (!view) return () => undefined;
      const observer = new view.MutationObserver((records) => {
        for (const record of records) onMutation(feed, record);
      });
      observer.observe(feed, { subtree: true, childList: true, attributeFilter: ['tabindex'] });
      return () => observer.disconnect();
    },
  };
}
