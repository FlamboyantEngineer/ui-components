// ID references and popups resolve in the tree that holds an element: its shadow root when it is
// inside one, else its document. `document.getElementById` never enters a shadow root.

/** The document or shadow root whose IDs an element's references name. */
export function getTreeScope(element: Element): Document | ShadowRoot {
  const root = element.getRootNode();
  return root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in root
    ? (root as ShadowRoot)
    : element.ownerDocument;
}

/** The element with `id` in the tree that holds `element`, or null. */
export function getReferencedElement(element: Element, id: string): HTMLElement | null {
  return getTreeScope(element).getElementById(id);
}
