import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { defaultLayerZIndex, overlayLayers, type OverlayLayer } from './layers.js';
import { Portal, PortalContainerProvider, PortalHost, useLayerZIndex } from './portal.js';

function wrappers(root: ParentNode = document.body): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.ui-portal'));
}

const appended: Element[] = [];

function appendToBody<T extends Element>(element: T): T {
  document.body.append(element);
  appended.push(element);
  return element;
}

afterEach(() => {
  for (const element of appended.splice(0)) element.remove();
});

describe('Portal', () => {
  it('UIC-PORTAL-1.1 renders its children in a wrapper appended to the document body', () => {
    const { container } = render(
      <section>
        <Portal>
          <p>Fruit basket</p>
        </Portal>
      </section>,
    );
    const [wrapper] = wrappers();
    expect(wrapper?.parentElement).toBe(document.body);
    expect(wrapper).toHaveTextContent('Fruit basket');
    expect(container.querySelector('section')).toBeEmptyDOMElement();
    expectHooksMatchSpec(document.body, 'PORTAL');
  });

  it('UIC-PORTAL-1.1 keeps context and React events with the component that renders it', async () => {
    const Fruit = createContext('none');
    function Reader() {
      return <span>{useContext(Fruit)}</span>;
    }
    const onClick = vi.fn();
    render(
      <Fruit.Provider value="pear">
        <div onClick={onClick}>
          <Portal>
            <Reader />
            <button type="button">Pick</button>
          </Portal>
        </div>
      </Fruit.Provider>,
    );
    expect(wrappers()[0]).toHaveTextContent('pear');
    await userEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('UIC-PORTAL-1.2 renders into the nearest provider container and waits for a null one', () => {
    const outer = appendToBody(document.createElement('div'));
    const inner = appendToBody(document.createElement('div'));
    function Harness({ ready }: { ready: boolean }) {
      return (
        <PortalContainerProvider container={outer}>
          <Portal data-testid="outer">Lemon</Portal>
          <PortalContainerProvider>
            <Portal data-testid="inherited">Lime</Portal>
          </PortalContainerProvider>
          <PortalContainerProvider container={ready ? inner : null}>
            <Portal data-testid="inner">Orange</Portal>
          </PortalContainerProvider>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Harness ready={false} />);
    expect(screen.getByTestId('outer').parentElement).toBe(outer);
    expect(screen.getByTestId('inherited').parentElement).toBe(outer);
    expect(screen.queryByTestId('inner')).toBeNull();
    expect(document.body.querySelector(':scope > .ui-portal')).toBeNull();

    rerender(<Harness ready />);
    expect(screen.getByTestId('inner').parentElement).toBe(inner);
  });

  it('UIC-PORTAL-1.3 a portal host renders its container after its children and owns its portals', () => {
    function Page({ open }: { open: boolean }) {
      return open ? (
        <PortalHost data-testid="host">
          <p>Page content</p>
          <Portal layer="tooltip">Tip</Portal>
          <Portal layer="modal">Dialog</Portal>
          <PortalHost data-testid="nested">
            <Portal layer="toast">Saved</Portal>
          </PortalHost>
        </PortalHost>
      ) : null;
    }
    const { container, rerender } = render(<Page open />);
    const host = screen.getByTestId('host');
    const nested = screen.getByTestId('nested');
    expect(host).toHaveClass('ui-portal-host');
    expect(host.parentElement).toBe(container);
    expect(container.firstElementChild).toHaveTextContent('Page content');
    expect(container.lastElementChild).toBe(host);
    expect(wrappers(host).filter((wrapper) => wrapper.parentElement === host)).toHaveLength(2);
    expect(screen.getByText('Saved').parentElement).toBe(nested);
    expect(document.body.querySelector(':scope > .ui-portal')).toBeNull();
    expectHooksMatchSpec(container, 'PORTAL', { callerAttributes: ['data-testid'] });

    rerender(<Page open={false} />);
    expect(document.querySelector('.ui-portal-host')).toBeNull();
    expect(wrappers()).toHaveLength(0);
  });

  it('UIC-PORTAL-1.4 renders nothing on the server and mounts after hydration', async () => {
    function App() {
      return (
        <main>
          <h2>Cities</h2>
          <Portal layer="toast">Oslo</Portal>
        </main>
      );
    }
    const markup = renderToString(<App />);
    expect(markup).not.toContain('ui-portal');
    expect(renderToString(<Portal>Alone</Portal>)).toBe('');

    const root = appendToBody(document.createElement('div'));
    root.innerHTML = markup;
    const errors = vi.spyOn(console, 'error');
    const hydrateErrors: unknown[] = [];
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(root, <App />, {
        onRecoverableError: (error) => hydrateErrors.push(error),
      });
    });
    expect(hydrateErrors).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(wrappers()[0]).toHaveTextContent('Oslo');
    act(() => app?.unmount());
  });

  it('UIC-PORTAL-2.1 publishes its layer, dropdown by default, in the layer order', () => {
    expect(overlayLayers).toEqual([
      'backdrop',
      'drawer',
      'modal',
      'dropdown',
      'context-menu',
      'tooltip',
      'toast',
    ]);
    render(
      <>
        <Portal>Default</Portal>
        {overlayLayers.map((layer) => (
          <Portal key={layer} layer={layer}>
            {layer}
          </Portal>
        ))}
      </>,
    );
    const [first, ...rest] = wrappers();
    expect(first).toHaveAttribute('data-layer', 'dropdown');
    expect(rest.map((wrapper) => wrapper.dataset.layer)).toEqual([...overlayLayers]);
    expectHooksMatchSpec(document.body, 'PORTAL');
  });

  it('UIC-PORTAL-2.2 stacks later layers above earlier ones whatever the mount order', () => {
    render(
      <>
        {[...overlayLayers].reverse().map((layer) => (
          <Portal key={layer} layer={layer}>
            {layer}
          </Portal>
        ))}
        <Portal layer="toast">Second toast</Portal>
      </>,
    );
    const byLayer = new Map<string, HTMLElement[]>();
    for (const wrapper of wrappers()) {
      expect(wrapper.style.position).toBe('absolute');
      expect(wrapper.style.top).toBe('0px');
      expect(wrapper.style.left).toBe('0px');
      byLayer.set(wrapper.dataset.layer ?? '', [
        ...(byLayer.get(wrapper.dataset.layer ?? '') ?? []),
        wrapper,
      ]);
    }
    const zIndexes = overlayLayers.map((layer) => Number(byLayer.get(layer)?.[0]?.style.zIndex));
    expect(zIndexes).toEqual([100, 110, 120, 130, 140, 150, 160]);
    expect(zIndexes).toEqual(overlayLayers.map((layer) => defaultLayerZIndex[layer]));
    const [firstToast, secondToast] = byLayer.get('toast') ?? [];
    expect(secondToast?.style.zIndex).toBe(firstToast?.style.zIndex);
    expect(firstToast?.compareDocumentPosition(secondToast as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('UIC-PORTAL-2.2 lets providers replace layer z-indexes and reports them', () => {
    const seen: Record<string, number> = {};
    function Probe({ layer, name }: { layer: OverlayLayer; name: string }) {
      seen[name] = useLayerZIndex(layer);
      return null;
    }
    render(
      <>
        <Probe layer="dropdown" name="default" />
        <PortalContainerProvider layerZIndex={{ dropdown: 1000, toast: 2000 }}>
          <Probe layer="dropdown" name="outer" />
          <PortalHost layerZIndex={{ toast: 3000 }}>
            <Probe layer="dropdown" name="inherited" />
            <Probe layer="tooltip" name="untouched" />
            <Portal layer="toast" data-testid="toast">
              Hi
            </Portal>
          </PortalHost>
        </PortalContainerProvider>
      </>,
    );
    expect(seen).toEqual({ default: 130, outer: 1000, inherited: 1000, untouched: 150 });
    expect(screen.getByTestId('toast').style.zIndex).toBe('3000');
  });

  it('UIC-PORTAL-3.1 adds no role, name, tab stop or focus handling', () => {
    render(
      <PortalHost>
        <Portal>
          <span>Plain</span>
        </Portal>
      </PortalHost>,
    );
    for (const element of [wrappers()[0], document.querySelector('.ui-portal-host')]) {
      expect(element).not.toHaveAttribute('role');
      expect(element).not.toHaveAttribute('tabindex');
      expect(element).not.toHaveAttribute('aria-label');
      expect(element).not.toHaveAttribute('aria-hidden');
    }
  });

  it('UIC-PORTAL-3.2 marks layers above modal as React Aria top layers, overridable', () => {
    render(
      <>
        {overlayLayers.map((layer) => (
          <Portal key={layer} layer={layer}>
            {layer}
          </Portal>
        ))}
        <Portal layer="toast" topLayer={false} data-testid="plain-toast">
          Plain
        </Portal>
        <Portal layer="modal" topLayer data-testid="top-modal">
          Top
        </Portal>
      </>,
    );
    const top = wrappers()
      .filter((wrapper) => wrapper.hasAttribute('data-react-aria-top-layer'))
      .map((wrapper) => wrapper.textContent);
    expect(top).toEqual(['dropdown', 'context-menu', 'tooltip', 'toast', 'Top']);
  });

  it('UIC-PORTAL-3.2 stays usable while a React Aria modal is open', async () => {
    const onOpenChange = vi.fn();
    function Suggestions({ children }: { children: ReactNode }) {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Suggest
          </button>
          {open ? children : null}
        </>
      );
    }
    render(
      <>
        <Portal layer="backdrop" data-testid="behind">
          <button type="button">Behind</button>
        </Portal>
        <ModalOverlay isOpen isDismissable onOpenChange={onOpenChange}>
          <Modal>
            <Dialog aria-label="Pick a colour">
              <Suggestions>
                <Portal data-testid="list">
                  <button type="button">Teal</button>
                </Portal>
                <Portal layer="dropdown" topLayer={false} data-testid="contained">
                  <button type="button">Plum</button>
                </Portal>
              </Suggestions>
            </Dialog>
          </Modal>
        </ModalOverlay>
      </>,
    );
    expect(screen.getByTestId('behind')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest' }));
    const list = screen.getByTestId('list');
    expect(list).not.toHaveAttribute('aria-hidden');
    expect(screen.getByTestId('contained')).toHaveAttribute('aria-hidden', 'true');

    const teal = screen.getByRole('button', { name: 'Teal' });
    await userEvent.click(teal);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => teal.focus());
    expect(document.activeElement).toBe(teal);

    const plum = screen.getByText('Plum');
    act(() => plum.focus());
    expect(document.activeElement).not.toBe(plum);
  });

  it('UIC-PORTAL-3.3 appends the caller class and forwards id and data attributes', () => {
    render(
      <PortalHost className="host-caller" id="overlays" data-region="main">
        <Portal className="caller" id="menu" data-testid="probe" data-layer="bogus" layer="tooltip">
          Menu
        </Portal>
      </PortalHost>,
    );
    const wrapper = screen.getByTestId('probe');
    expect(wrapper).toHaveClass('ui-portal', 'caller');
    expect(wrapper).toHaveAttribute('id', 'menu');
    expect(wrapper).toHaveAttribute('data-layer', 'tooltip');
    const host = document.getElementById('overlays');
    expect(host).toHaveClass('ui-portal-host', 'host-caller');
    expect(host).toHaveAttribute('data-region', 'main');
    expectHooksMatchSpec(document.body, 'PORTAL', { callerAttributes: ['data-region'] });
  });
});
