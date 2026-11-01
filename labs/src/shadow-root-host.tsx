import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Renders `children` into an open shadow root, as a web component would hold them. */
export function ShadowRootHost({ demo, children }: { demo: string; children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
  }, []);
  return (
    <div data-lab-demo={demo} ref={hostRef}>
      {root ? createPortal(children, root) : null}
    </div>
  );
}
