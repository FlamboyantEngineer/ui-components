import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { enableShadowRoots } from '../../src/components/portal/index.js';
import { UiProvider } from '../../src/core/provider.js';

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

/**
 * Renders `children` in a React root of their own inside an open shadow root, as a web component
 * that mounts its own app does, so events reach React inside the shadow tree without retargeting.
 * It calls `enableShadowRoots`, as a host embedding the library in web components does.
 */
export function ShadowRootApp({ demo, children }: { demo: string; children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Root | null>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    enableShadowRoots();
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const container = shadow.appendChild(document.createElement('div'));
    const app = createRoot(container);
    appRef.current = app;
    return () => {
      appRef.current = null;
      // Unmounting a root while React renders this one is not allowed; let this render finish.
      setTimeout(() => {
        app.unmount();
        container.remove();
      });
    };
  }, []);
  useLayoutEffect(() => {
    appRef.current?.render(<UiProvider>{children}</UiProvider>);
  });
  return <div data-lab-demo={demo} ref={hostRef} />;
}
