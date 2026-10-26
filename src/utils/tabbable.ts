// Which elements Tab reaches, for components that move focus or manage tab stops by hand.

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
    ? element.checkVisibility({ visibilityProperty: true })
    : true;
}

/** The elements inside `root` that Tab reaches, in document order. */
export function listTabbables(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(tabbableSelector)].filter(isTabbable);
}
