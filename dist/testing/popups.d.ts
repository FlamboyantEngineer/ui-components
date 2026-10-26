/**
 * The popup a trigger opened: the element its `aria-controls` names when that has `role`, otherwise
 * the last element with `role` in the document (overlays render at the end of the body). Waits for
 * it, since React Aria opens overlays after the press.
 */
export declare function findPopup(trigger: Element, role: 'listbox' | 'menu'): Promise<HTMLElement>;
//# sourceMappingURL=popups.d.ts.map