// Which elements Tab reaches, for components that move focus or manage tab stops by hand.

import { getOwnerWindow } from './owner-window.js';

/** Elements that can join the tab order. */
export const tabbableSelector = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

/** Rendering follows assigned slots and crosses shadow roots to their hosts. */
function getRenderedParent(element: Element): Element | null {
  const root = element.getRootNode();
  return (
    element.assignedSlot ??
    element.parentElement ??
    (root.nodeType === 11 ? (root as ShadowRoot).host : null)
  );
}

/** Rendered visibility for engines without checkVisibility; no layout-size assumptions. */
function isVisible(element: HTMLElement): boolean {
  const owner = getOwnerWindow(element);
  const style = owner.getComputedStyle(element);
  // Visibility is inherited, but descendants may explicitly restore it.
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  if (style.display === 'contents') return false;
  let child: Element = element;
  for (let node: Element | null = element; node; node = getRenderedParent(node)) {
    const currentStyle = owner.getComputedStyle(node);
    if (currentStyle.display === 'none') return false;
    if (node === element) continue;
    // These hide contents, not the container's own box or its first summary.
    if (currentStyle.contentVisibility === 'hidden') return false;
    if (node.matches('details:not([open])') && node.querySelector(':scope > summary') !== child) {
      return false;
    }
    child = node;
  }
  return true;
}

/** Whether Tab reaches `element`: in the tab order, enabled, rendered and not hidden or inert. */
export function isTabbable(element: HTMLElement): boolean {
  if (
    element.tabIndex < 0 ||
    element.matches(':disabled') ||
    element.closest('[inert], [hidden]')
  ) {
    return false;
  }
  return typeof element.checkVisibility === 'function'
    ? element.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true })
    : isVisible(element);
}

/** The elements inside `root` that Tab reaches, in document order. */
export function listTabbables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(tabbableSelector)].filter(isTabbable);
}

/** The way Tab moves: forward with Tab, backward with Shift+Tab. */
export type TabDirection = 'forward' | 'backward';

/** A named radio button, which shares one tab stop with its group. */
function asGroupedRadio(element: Element): HTMLInputElement | null {
  const input = element as HTMLInputElement;
  return element.tagName === 'INPUT' && input.type === 'radio' && input.name ? input : null;
}

/** Whether `a` and `b` are radio buttons of one group: one name in one form, or in no form. */
export function isSameRadioGroup(a: Element, b: Element): boolean {
  const first = asGroupedRadio(a);
  const second = asGroupedRadio(b);
  return (
    first !== null &&
    second !== null &&
    first.name === second.name &&
    first.form === second.form &&
    first.getRootNode() === second.getRootNode()
  );
}

/**
 * The tab stops inside `root`, in document order, as Tab visits them: a radio group is one stop,
 * its checked button, or with none checked its first, whichever way Tab moves (as Chromium does).
 * Positive `tabIndex` values are not given their earlier place.
 */
export function listTabStops(root: ParentNode): HTMLElement[] {
  const tabbables = listTabbables(root);
  return tabbables.filter((element) => {
    if (!asGroupedRadio(element)) return true;
    const group = tabbables.filter((other) => isSameRadioGroup(element, other));
    const checked = group.find((radio) => (radio as HTMLInputElement).checked);
    return element === (checked ?? group[0]);
  });
}
