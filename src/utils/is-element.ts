// Node type checks that hold for nodes of any window. `instanceof HTMLElement` holds only for
// elements of the script's own window, so it fails for an element in a same-origin frame or a popup
// window that a portal host renders into.

const htmlNamespace = 'http://www.w3.org/1999/xhtml';

/** Whether a value is a DOM node, from any window. */
export function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<Node>).nodeType === 'number' &&
    typeof (value as Partial<Node>).nodeName === 'string'
  );
}

/** Whether a value is an element, from any window. */
export function isElement(value: unknown): value is Element {
  return isNode(value) && value.nodeType === 1;
}

/** Whether a value is an HTML element, from any window, and with `tag`, one of that tag. */
export function isHTMLElement<K extends keyof HTMLElementTagNameMap>(
  value: unknown,
  tag: K,
): value is HTMLElementTagNameMap[K];
export function isHTMLElement(value: unknown): value is HTMLElement;
export function isHTMLElement(value: unknown, tag?: string): boolean {
  return (
    isElement(value) &&
    value.namespaceURI === htmlNamespace &&
    (tag === undefined || value.localName === tag)
  );
}

/** Whether a node is a shadow root, from any window. */
export function isShadowRoot(node: Node): node is ShadowRoot {
  return node.nodeType === 11 && 'host' in node;
}
