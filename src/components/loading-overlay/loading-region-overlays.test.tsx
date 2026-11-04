import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { CommandPalette } from '../command-palette/command-palette.js';
import { Drawer } from '../drawer/drawer.js';
import { Menu, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { Modal } from '../modal/modal.js';
import { SelectField } from '../select-field/select-field.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { LoadingRegion } from './loading-overlay.js';

type Boundary = 'region' | 'skeleton';

function Actions({ onAction }: { onAction?: (key: unknown) => void }) {
  return (
    <MenuTrigger>
      <Button>Actions</Button>
      <MenuPopover>
        <Menu
          aria-label="Actions"
          items={[
            { id: 'run', label: 'Run action' },
            { id: 'more', label: 'More', items: [{ id: 'copy', label: 'Copy' }] },
          ]}
          onAction={onAction}
        />
      </MenuPopover>
    </MenuTrigger>
  );
}

function Around({
  boundary,
  isLoading,
  delay,
  children,
}: {
  boundary: Boundary;
  isLoading: boolean;
  delay?: number;
  children: ReactNode;
}) {
  return boundary === 'region' ? (
    <LoadingRegion isLoading={isLoading} delay={delay} label="Refreshing">
      {children}
    </LoadingRegion>
  ) : (
    <Skeleton isLoading={isLoading}>{children}</Skeleton>
  );
}

function setup(boundary: Boundary, delay?: number) {
  const onAction = vi.fn();
  const view = (isLoading: boolean) => (
    <Around boundary={boundary} isLoading={isLoading} delay={delay}>
      <Actions onAction={onAction} />
    </Around>
  );
  const { rerender } = render(view(false));
  return { onAction, setLoading: (isLoading: boolean) => rerender(view(isLoading)) };
}

const regionRoot = () => document.querySelector<HTMLElement>('.ui-loading-region');

async function openRunAction(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.keyboard('{ArrowDown}');
  await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Run action' })).toHaveFocus());
}

describe('LoadingRegion and Skeleton suspend the overlays their content opened', () => {
  it.each<Boundary>(['region', 'skeleton'])(
    'UIC-LOADING-OVERLAY-3.5 UIC-SKELETON-2.3 closes a menu focused before %s loading starts, so Enter runs nothing',
    async (boundary) => {
      const user = userEvent.setup();
      const { onAction, setLoading } = setup(boundary);
      await openRunAction(user);
      setLoading(true);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      await user.keyboard('{Enter}');
      expect(onAction).not.toHaveBeenCalled();
    },
  );

  it('UIC-LOADING-OVERLAY-3.5 holds focus on the region and returns it to the trigger', async () => {
    const user = userEvent.setup();
    const { setLoading } = setup('region');
    await openRunAction(user);
    setLoading(true);
    expect(regionRoot()).toHaveFocus();
    setLoading(false);
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.5 closes a submenu with its menu', async () => {
    const user = userEvent.setup();
    const { setLoading } = setup('region');
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'More' }));
    expect(await screen.findByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();
    setLoading(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(regionRoot()).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.5 closes a select field popup', async () => {
    const user = userEvent.setup();
    const field = (isLoading: boolean) => (
      <LoadingRegion isLoading={isLoading} label="Refreshing">
        <SelectField
          label="Fruit"
          options={[
            { id: 'apple', label: 'Apple' },
            { id: 'pear', label: 'Pear' },
          ]}
        />
      </LoadingRegion>
    );
    const { rerender } = render(field(false));
    const trigger = screen.getByRole('button', { name: /Fruit$/ });
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    rerender(field(true));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(field(false));
    expect(trigger).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.5 keeps the menu until a delayed region blocks', async () => {
    const user = userEvent.setup();
    const { setLoading } = setup('region', 50);
    await openRunAction(user);
    setLoading(true);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(regionRoot()).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.5 suspends again on every loading transition', async () => {
    const user = userEvent.setup();
    const { onAction, setLoading } = setup('region');
    for (let round = 0; round < 2; round += 1) {
      await openRunAction(user);
      setLoading(true);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      setLoading(false);
    }
    await openRunAction(user);
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith('run');
  });

  it('UIC-LOADING-OVERLAY-3.5 leaves a menu opened outside the region open', async () => {
    const user = userEvent.setup();
    const view = (isLoading: boolean) => (
      <>
        <Actions />
        <LoadingRegion isLoading={isLoading} label="Refreshing">
          <p>Content</p>
        </LoadingRegion>
      </>
    );
    const { rerender } = render(view(false));
    await openRunAction(user);
    rerender(view(true));
    expect(screen.getByRole('menuitem', { name: 'Run action' })).toHaveFocus();
  });
});

type DialogKind = 'modal' | 'drawer' | 'palette';

/** A page region whose Edit button opens a dialog holding a menu; the host drives both states. */
function DialogPage({
  kind,
  isLoading,
  isOpen,
  onOpen,
}: {
  kind: DialogKind;
  isLoading: boolean;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const dialog =
    kind === 'modal' ? (
      <Modal title="Edit" isOpen={isOpen} onOpenChange={() => {}} cancelAction={null}>
        <Actions />
      </Modal>
    ) : kind === 'drawer' ? (
      <Drawer title="Edit" isOpen={isOpen} onOpenChange={() => {}}>
        <Actions />
      </Drawer>
    ) : (
      <CommandPalette
        shortcut={null}
        isOpen={isOpen}
        onOpenChange={() => {}}
        items={[{ id: 'run', label: 'Run action' }]}
      />
    );
  return (
    <LoadingRegion isLoading={isLoading} label="Refreshing">
      <button type="button" onClick={onOpen}>
        Edit
      </button>
      {dialog}
    </LoadingRegion>
  );
}

function setupDialog(kind: DialogKind) {
  let state = { isLoading: false, isOpen: false };
  const view = () => (
    <DialogPage
      kind={kind}
      {...state}
      onOpen={() => {
        state = { ...state, isOpen: true };
        rerender(view());
      }}
    />
  );
  const { rerender } = render(view());
  return {
    set: (next: Partial<typeof state>) => {
      state = { ...state, ...next };
      rerender(view());
    },
  };
}

describe('Dialogs opened from loading content are their own loading boundary', () => {
  // React Aria's sheet watches its panel with an intersection observer, which jsdom lacks.
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    Element.prototype.scrollTo = () => {};
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error -- jsdom has no scrollTo; the stub goes away with the suite.
    delete Element.prototype.scrollTo;
  });

  it.each<DialogKind>(['modal', 'drawer'])(
    'UIC-LOADING-OVERLAY-3.5 opens a menu inside a %s while the page beneath loads',
    async (kind) => {
      const user = userEvent.setup();
      const { set } = setupDialog(kind);
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      await screen.findByRole('dialog', { name: 'Edit' });
      set({ isLoading: true });
      await user.click(screen.getByRole('button', { name: 'Actions' }));
      expect(await screen.findByRole('menuitem', { name: 'Run action' })).toBeInTheDocument();
    },
  );

  it('UIC-LOADING-OVERLAY-3.5 keeps a menu open in a modal when the page beneath starts loading', async () => {
    const user = userEvent.setup();
    const { set } = setupDialog('modal');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await screen.findByRole('dialog', { name: 'Edit' });
    await openRunAction(user);
    set({ isLoading: true });
    expect(screen.getByRole('menuitem', { name: 'Run action' })).toHaveFocus();
    expect(regionRoot()).not.toHaveFocus();
  });

  it.each<DialogKind>(['modal', 'palette'])(
    'UIC-LOADING-OVERLAY-3.5 holds focus on the region when a %s closes as loading starts, then returns it to the opener',
    async (kind) => {
      const user = userEvent.setup();
      const { set } = setupDialog(kind);
      const edit = screen.getByRole('button', { name: 'Edit' });
      await user.click(edit);
      const dialog = await screen.findByRole('dialog');
      await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
      set({ isLoading: true, isOpen: false });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(document.body).not.toHaveFocus();
      expect(regionRoot()).toHaveFocus();
      set({ isLoading: false });
      expect(edit).toHaveFocus();
    },
  );
});
