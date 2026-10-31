// The document and window a node belongs to. A component rendered into a same-origin frame or a
// popup window (through a portal host) listens, looks up and measures there, not in the script's
// own window.

/** The document `node` belongs to, or the script's own document without a node. */
export function getOwnerDocument(node: Node | null | undefined): Document {
  if (!node) return document;
  return node.nodeType === 9 ? (node as Document) : (node.ownerDocument ?? document);
}

/**
 * The document `node` belongs to, the script's own without a node, or null on the server, for a
 * read made in render before the component has an element.
 */
export function findOwnerDocument(node: Node | null | undefined): Document | null {
  if (node) return getOwnerDocument(node);
  return typeof document === 'undefined' ? null : document;
}

/** The window `node`'s document belongs to, or the script's own window without a node. */
export function getOwnerWindow(node: Node | null | undefined): Window & typeof globalThis {
  return (getOwnerDocument(node).defaultView as (Window & typeof globalThis) | null) ?? window;
}

/** The element with `id` in the tree `node` is in: its shadow root, else its document. */
export function getElementByIdFrom(node: Node | null | undefined, id: string): HTMLElement | null {
  const root = node?.getRootNode();
  if (root?.nodeType === 11) return (root as ShadowRoot).getElementById(id);
  return getOwnerDocument(node).getElementById(id);
}
