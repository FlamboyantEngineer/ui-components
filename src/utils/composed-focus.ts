// Where focus is, read through same-origin frames and open shadow roots: inside a shadow root a
// document's `activeElement` names the host, not the element that holds focus.

/**
 * The focused element, followed into same-origin frames and open shadow roots: a document whose
 * focus sits on a frame or a shadow host reports that element, not the one inside it with focus.
 */
export function getDeepActiveElement(owner: Document = document): Element | null {
  let active = owner.activeElement;
  for (;;) {
    const inner =
      active?.shadowRoot?.activeElement ??
      (active?.tagName === 'IFRAME'
        ? (active as HTMLIFrameElement).contentDocument?.activeElement
        : null);
    if (!inner) return active;
    active = inner;
  }
}

/**
 * The element holding focus in the tree `node` belongs to, followed into open shadow roots: a
 * document or shadow root whose focus sits inside a shadow host reports the host, not the element
 * inside it.
 */
export function getComposedActiveElement(node: Node): Element | null {
  const root = node.getRootNode() as Partial<DocumentOrShadowRoot>;
  let active = root.activeElement ?? null;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

/**
 * Whether `element` holds focus, read in `root`, the tree it belongs to (pass the tree read before
 * the element leaves it), and through open shadow roots.
 */
export function isFocused(
  element: Element | null | undefined,
  root: Node | null | undefined = element,
): boolean {
  return !!element && !!root && getComposedActiveElement(root) === element;
}

/** Whether `node` is `container` or inside it, also through the shadow roots of its hosts. */
export function containsComposed(container: Node, node: Node | null): boolean {
  let current = node;
  while (current) {
    if (current === container) return true;
    current = current.parentNode ?? (current as Partial<ShadowRoot>).host ?? null;
  }
  return false;
}

/** Whether focus sits on `container` or inside it, read in its tree and through open shadow roots. */
export function containsFocus(container: Node | null | undefined): boolean {
  return !!container && containsComposed(container, getComposedActiveElement(container));
}

/**
 * Whether focus fell to the page: nothing in the document `node` belongs to holds it, or its body
 * does. An element that leaves a shadow root with focus leaves the page's focus on the body too.
 */
export function isFocusLost(node: Node): boolean {
  const owner = node.ownerDocument ?? (node as Document);
  const active = owner.activeElement;
  return !active || active === owner.body;
}
