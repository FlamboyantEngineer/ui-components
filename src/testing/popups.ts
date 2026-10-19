import { waitFor, within } from '@testing-library/dom';

/**
 * The popup a trigger opened: the element its `aria-controls` names when that has `role`, otherwise
 * the last element with `role` in the document (overlays render at the end of the body). Waits for
 * it, since React Aria opens overlays after the press.
 */
export function findPopup(trigger: Element, role: 'listbox' | 'menu'): Promise<HTMLElement> {
  const document = trigger.ownerDocument;
  return waitFor(() => {
    const id = trigger.getAttribute('aria-controls');
    const controlled = id ? document.getElementById(id) : null;
    if (controlled?.getAttribute('role') === role) return controlled;
    const popups = within(document.body).getAllByRole(role);
    return popups[popups.length - 1] as HTMLElement;
  });
}
