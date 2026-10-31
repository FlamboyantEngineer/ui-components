import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Dialog, Modal, ModalOverlay } from '../../primitives/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { defaultLayerZIndex, isLayerAbove, overlayLayers, type OverlayLayer } from './layers.js';
import { Portal, PortalContainerProvider, PortalHost, useLayerZIndex } from './portal.js';
import { Button } from '../button/button.js';
import { Menu, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { Modal as LibraryModal } from '../modal/modal.js';
import { AnchoredTooltip, Tooltip } from '../tooltip/tooltip.js';

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
          <Portal>Lemon</Portal>
          <PortalContainerProvider>
            <Portal>Lime</Portal>
          </PortalContainerProvider>
          <PortalContainerProvider container={ready ? inner : null}>
            <Portal>Orange</Portal>
          </PortalContainerProvider>
        </PortalContainerProvider>
      );
    }
    const { rerender } = render(<Harness ready={false} />);
    expect(screen.getByText('Lemon').parentElement).toBe(outer);
    expect(screen.getByText('Lime').parentElement).toBe(outer);
    expect(screen.queryByText('Orange')).not.toBeInTheDocument();
    expect(document.body.querySelector(':scope > .ui-portal')).toBeNull();

    rerender(<Harness ready />);
    expect(screen.getByText('Orange').parentElement).toBe(inner);
  });

  it('UIC-PORTAL-1.2 UIC-PORTAL-1.3 renders React Aria and library overlays into the host', async () => {
    const user = userEvent.setup();
    const anchor = appendToBody(document.createElement('span'));
    render(
      <PortalHost id="overlay-host">
        <MenuTrigger>
          <Button>Actions</Button>
          <MenuPopover>
            <Menu aria-label="Actions" items={[{ id: 'copy', label: 'Copy' }]} />
          </MenuPopover>
        </MenuTrigger>
        <Tooltip content="Hint" isOpen>
          <Button>Hinted</Button>
        </Tooltip>
        <AnchoredTooltip isOpen anchor={anchor} content="Anchored" />
        <LibraryModal title="Blocking" defaultOpen>
          Body
        </LibraryModal>
        <LibraryModal title="Floating" defaultOpen isNonModal>
          Body
        </LibraryModal>
        <LibraryModal title="Retained" defaultOpen keepMounted>
          Body
        </LibraryModal>
      </PortalHost>,
    );
    const host = document.getElementById('overlay-host');
    for (const name of ['Blocking', 'Floating', 'Retained']) {
      expect(host).toContainElement(screen.getByRole('dialog', { name }));
    }
    expect(host).toContainElement(screen.getByText('Anchored'));
    expect(host).toContainElement(await screen.findByText('Hint'));
    await user.click(screen.getByRole('button', { name: 'Actions', hidden: true }));
    expect(host).toContainElement(await screen.findByRole('menu', { name: 'Actions' }));
  });

  it('UIC-PORTAL-1.2 renders no React Aria overlay while the chosen container is not ready', () => {
    render(
      <PortalContainerProvider container={null}>
        <LibraryModal title="Waiting" defaultOpen>
          Body
        </LibraryModal>
        <LibraryModal title="Floating" defaultOpen isNonModal>
          Body
        </LibraryModal>
      </PortalContainerProvider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-PORTAL-1.3 a portal host renders its container after its children and owns its portals', () => {
    function Page({ open }: { open: boolean }) {
      return open ? (
        <PortalHost id="page-host">
          <p>Page content</p>
          <Portal layer="tooltip">Tip</Portal>
          <Portal layer="modal">Dialog</Portal>
          <PortalHost id="nested-host">
            <Portal layer="toast">Saved</Portal>
          </PortalHost>
        </PortalHost>
      ) : null;
    }
    const { container, rerender } = render(<Page open />);
    const host = document.getElementById('page-host') as HTMLElement;
    const nested = document.getElementById('nested-host');
    expect(host).toHaveClass('ui-portal-host');
    expect(host.parentElement).toBe(container);
    expect(container.firstElementChild).toHaveTextContent('Page content');
    expect(container.lastElementChild).toBe(host);
    expect(wrappers(host).filter((wrapper) => wrapper.parentElement === host)).toHaveLength(2);
    expect(screen.getByText('Saved').parentElement).toBe(nested);
    expect(document.body.querySelector(':scope > .ui-portal')).toBeNull();
    expectHooksMatchSpec(container, 'PORTAL');

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
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToString returns an HTML string, not a render result
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
    expect(isLayerAbove('toast', 'modal')).toBe(true);
    expect(isLayerAbove('backdrop', 'drawer')).toBe(false);
    expect(isLayerAbove('modal', 'modal')).toBe(false);
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
            <Portal layer="toast">Hi</Portal>
          </PortalHost>
        </PortalContainerProvider>
      </>,
    );
    expect(seen).toEqual({ default: 130, outer: 1000, inherited: 1000, untouched: 150 });
    expect(screen.getByText('Hi').style.zIndex).toBe('3000');
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
        <Portal layer="toast" topLayer={false}>
          Plain
        </Portal>
        <Portal layer="modal" topLayer>
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
        <Portal layer="backdrop">
          <button type="button">Behind</button>
        </Portal>
        <ModalOverlay isOpen isDismissable onOpenChange={onOpenChange}>
          <Modal>
            <Dialog aria-label="Pick a colour">
              <Suggestions>
                <Portal>
                  <button type="button">Teal</button>
                </Portal>
                <Portal layer="dropdown" topLayer={false}>
                  <button type="button">Plum</button>
                </Portal>
              </Suggestions>
            </Dialog>
          </Modal>
        </ModalOverlay>
      </>,
    );
    expect(screen.getByText('Behind').closest('.ui-portal')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Suggest' }));
    const list = screen.getByRole('button', { name: 'Teal' }).closest('.ui-portal');
    expect(list).not.toHaveAttribute('aria-hidden');
    expect(screen.getByText('Plum').closest('.ui-portal')).toHaveAttribute('aria-hidden', 'true');

    const teal = screen.getByRole('button', { name: 'Teal' });
    await userEvent.click(teal);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => teal.focus());
    expect(teal).toHaveFocus();

    const plum = screen.getByText('Plum');
    act(() => plum.focus());
    expect(plum).not.toHaveFocus();
  });

  it('UIC-PORTAL-3.3 appends the caller class and forwards id and data attributes', () => {
    render(
      <PortalHost className="host-caller" id="overlays" data-region="main">
        <Portal className="caller" id="menu" data-sample="probe" data-layer="bogus" layer="tooltip">
          Menu
        </Portal>
      </PortalHost>,
    );
    const wrapper = screen.getByText('Menu');
    expect(wrapper).toHaveClass('ui-portal', 'caller');
    expect(wrapper).toHaveAttribute('id', 'menu');
    expect(wrapper).toHaveAttribute('data-sample', 'probe');
    expect(wrapper).toHaveAttribute('data-layer', 'tooltip');
    const host = document.getElementById('overlays');
    expect(host).toHaveClass('ui-portal-host', 'host-caller');
    expect(host).toHaveAttribute('data-region', 'main');
    expectHooksMatchSpec(document.body, 'PORTAL', {
      callerAttributes: ['data-region', 'data-sample'],
    });
  });

  it('UIC-PORTAL-1.5 renders in place with its layer, also on the server', () => {
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToString returns an HTML string, not a render result
    const markup = renderToString(
      <section>
        <Portal inPlace layer="tooltip">
          Tip
        </Portal>
      </section>,
    );
    expect(markup).toContain('class="ui-portal"');
    expect(markup).toContain('data-layer="tooltip"');

    const { container } = render(
      <section>
        <Portal inPlace layer="tooltip">
          Tip
        </Portal>
      </section>,
    );
    const wrapper = screen.getByText('Tip');
    expect(wrapper.parentElement).toBe(container.querySelector('section'));
    expect(wrapper).toHaveAttribute('data-layer', 'tooltip');
    expect(wrapper).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(wrapper.style.zIndex).toBe(String(defaultLayerZIndex.tooltip));
    expect(wrapper.style.position).toBe('absolute');
    expect(document.body.querySelector(':scope > .ui-portal')).toBeNull();
    expectHooksMatchSpec(container, 'PORTAL');
  });

  it('UIC-PORTAL-3.4 tabs into and out of the content as if it sat where it is declared', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Portal preserveTabOrder>
          <button type="button">Plum</button>
          <button type="button" disabled>
            Pear
          </button>
          <button type="button">Fig</button>
        </Portal>
        <button type="button">After</button>
      </>,
    );
    const button = (name: string) => screen.getByRole('button', { name });
    expect(wrappers()[0]?.parentElement).toBe(document.body);

    button('Before').focus();
    await user.tab();
    expect(button('Plum')).toHaveFocus();
    await user.tab();
    expect(button('Fig')).toHaveFocus();
    await user.tab();
    expect(button('After')).toHaveFocus();

    await user.tab({ shift: true });
    expect(button('Fig')).toHaveFocus();
    await user.tab({ shift: true });
    expect(button('Plum')).toHaveFocus();
    await user.tab({ shift: true });
    expect(button('Before')).toHaveFocus();
  });

  it('UIC-PORTAL-3.4 enters a radio group at its checked button, as Tab does in place', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Portal preserveTabOrder>
          <input type="radio" name="size" aria-label="Small" />
          <input type="radio" name="size" aria-label="Large" defaultChecked />
        </Portal>
        <button type="button">After</button>
      </>,
    );
    screen.getByRole('button', { name: 'Before' }).focus();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Large' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    screen.getByRole('button', { name: 'After' }).focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('radio', { name: 'Large' })).toHaveFocus();
  });

  it('UIC-PORTAL-3.4 skips content without tab stops', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Portal preserveTabOrder>
          <p>Notes</p>
        </Portal>
        <button type="button">After</button>
      </>,
    );
    screen.getByRole('button', { name: 'Before' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    // Reached at the document end, the content is skipped as Tab leaves the page: user-event
    // ignores `inert`, so the browser test e2e/portal.spec.ts follows that.
  });
});
