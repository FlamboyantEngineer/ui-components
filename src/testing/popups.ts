import { waitFor, within } from '@testing-library/dom';
import { getReferencedElement, getTreeScope } from './tree-scope.js';

/** The popups with `role` a trigger may have opened: in its shadow root, else in the document. */
function listPopups(trigger: Element, role: string): HTMLElement[] {
  const scope = getTreeScope(trigger);
  const inShadow =
    scope === trigger.ownerDocument
      ? []
      : [...scope.querySelectorAll<HTMLElement>(`[role="${role}"]`)];
  return inShadow.length > 0 ? inShadow : within(trigger.ownerDocument.body).queryAllByRole(role);
}

/**
 * The popup a trigger opened: the element its `aria-controls` names in the trigger's own tree
 * (document or shadow root) when that has `role` or holds one, otherwise the last element with
 * `role` in the trigger's shadow root, else in the document (overlays render at the end of the
 * body). While the element it names holds no such popup, the helper keeps waiting rather than
 * return another one. Waits for it, since React Aria opens overlays after the press.
 */
export function findPopup(trigger: Element, role: 'listbox' | 'menu'): Promise<HTMLElement> {
  return waitFor(() => {
    const id = trigger.getAttribute('aria-controls');
    const controlled = id ? getReferencedElement(trigger, id) : null;
    if (controlled) {
      if (controlled.getAttribute('role') === role) return controlled;
      const inner = controlled.querySelector<HTMLElement>(`[role="${role}"]`);
      if (inner) return inner;
      throw new Error(`The element the trigger controls (${id ?? ''}) holds no ${role}.`);
    }
    const popup = listPopups(trigger, role).at(-1);
    if (!popup) throw new Error(`No ${role} is open.`);
    return popup;
  });
}
