import { within } from '@testing-library/react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Renders `children` into an open shadow root of a host element named `name`. */
export function ShadowHost({ children, name }: { children: ReactNode; name: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
  }, []);
  return (
    <div ref={hostRef} data-host={name}>
      {root ? createPortal(children, root) : null}
    </div>
  );
}

/** The shadow root of the host named `name`, found in `scope`. */
export function shadowRootOf(name: string, scope: ParentNode = document): ShadowRoot {
  return scope.querySelector(`[data-host="${name}"]`)?.shadowRoot as ShadowRoot;
}

/** Role and label queries inside the shadow root of the host named `name`. */
export function inShadow(name: string) {
  // Testing Library queries any node with `querySelectorAll`; its types ask for an element.
  return within(shadowRootOf(name) as unknown as HTMLElement);
}

/** The focused element, followed into open shadow roots. */
export function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}
