import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StrictMode, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../components/button/button.js';
import { Combobox } from '../components/combobox/combobox.js';
import { DateTimeField } from '../components/date-time-field/date-time-field.js';
import { HoverCard, HoverCardTrigger } from '../components/hover-card/hover-card.js';
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  SubmenuTrigger,
} from '../components/menu/menu.js';
import { Popover } from '../components/popover/popover.js';
import { SelectField } from '../components/select-field/select-field.js';
import { Tooltip } from '../components/tooltip/tooltip.js';
import {
  createOverlayPresenceStore,
  useIsOverlayActive,
  useOverlayPresence,
  type OverlayPresence,
} from './overlay-presence.js';
import { UiProvider } from './provider.js';

/** Shows whether an overlay is open and hands out the presence for synchronous reads. */
function Probe({ name, onPresence }: { name: string; onPresence?: (p: OverlayPresence) => void }) {
  const presence = useOverlayPresence();
  onPresence?.(presence);
  return <output aria-label={name}>{useIsOverlayActive() ? 'active' : 'idle'}</output>;
}

function FileMenu() {
  return (
    <MenuTrigger>
      <Button>File</Button>
      <MenuPopover>
        <Menu aria-label="File">
          <MenuItem id="open">Open</MenuItem>
          <SubmenuTrigger>
            <MenuItem id="recent">Recent</MenuItem>
            <MenuPopover>
              <Menu aria-label="Recent" items={[{ id: 'notes', label: 'Notes.txt' }]} />
            </MenuPopover>
          </SubmenuTrigger>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}

function renderWithProbe(content: ReactNode) {
  let presence: OverlayPresence | undefined;
  const view = render(
    <UiProvider>
      <Probe name="Overlays" onPresence={(value) => (presence = value)} />
      {content}
    </UiProvider>,
  );
  // Found before any popup opens: a modal popup hides the rest of the page while open.
  const output = screen.getByRole('status', { name: 'Overlays' });
  const status = () => output;
  return { ...view, status, count: () => presence?.getCount() ?? -1 };
}

describe('Overlay presence', () => {
  it('UIC-PROVIDER-7.2 batches changes and removes a registration once', async () => {
    const store = createOverlayPresenceStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const first = store.register({});
    expect(store.isActive()).toBe(true);
    first();
    const shared = {};
    const second = store.register(shared);
    const copy = store.register(shared);
    first();
    copy();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getCount()).toBe(1);
    second();
    second();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.isActive()).toBe(false);
  });

  it('UIC-PROVIDER-7.1 counts a menu and its submenu until the last one closes', async () => {
    const user = userEvent.setup();
    const { status, count } = renderWithProbe(<FileMenu />);
    expect(status()).toHaveTextContent('idle');
    await user.click(screen.getByRole('button', { name: 'File' }));
    await waitFor(() => expect(status()).toHaveTextContent('active'));
    expect(count()).toBe(1);
    await user.click(screen.getByRole('menuitem', { name: 'Recent' }));
    await screen.findByRole('menu', { name: 'Recent' });
    expect(count()).toBe(2);
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(count()).toBe(1));
    expect(status()).toHaveTextContent('active');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(status()).toHaveTextContent('idle'));
    expect(count()).toBe(0);
  });

  it('UIC-PROVIDER-7.1 counts field popups: a select, a combobox and a calendar', async () => {
    const user = userEvent.setup();
    const { status, count } = renderWithProbe(
      <>
        <SelectField label="Fruit" options={[{ id: 1, label: 'Apple' }]} />
        <Combobox label="Colour" defaultItems={[{ id: 1, label: 'Red' }]} />
        <DateTimeField label="Due" defaultValue="2026-04-13" />
      </>,
    );
    // React Aria renders each list once more, hidden, while closed: that copy never counts.
    await act(() => Promise.resolve());
    expect(status()).toHaveTextContent('idle');
    await user.click(screen.getByRole('button', { name: /Fruit/ }));
    await waitFor(() => expect(status()).toHaveTextContent('active'));
    expect(count()).toBe(1);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(status()).toHaveTextContent('idle'));

    await user.click(screen.getByRole('combobox', { name: 'Colour' }));
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(status()).toHaveTextContent('active'));
    expect(count()).toBe(1);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(status()).toHaveTextContent('idle'));

    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    await waitFor(() => expect(status()).toHaveTextContent('active'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(status()).toHaveTextContent('idle'));
  });

  it('UIC-PROVIDER-7.2 follows a controlled popover and an outside press', async () => {
    const user = userEvent.setup();
    const anchor = { current: document.body };
    const panel = (isOpen: boolean) => (
      <UiProvider>
        <Probe name="Overlays" />
        <Popover isOpen={isOpen} triggerRef={anchor} aria-label="Filters">
          Filters
        </Popover>
      </UiProvider>
    );
    const { rerender, unmount } = render(panel(false));
    const output = screen.getByRole('status', { name: 'Overlays' });
    rerender(panel(true));
    await waitFor(() => expect(output).toHaveTextContent('active'));
    rerender(panel(false));
    await waitFor(() => expect(output).toHaveTextContent('idle'));
    unmount();

    const { status } = renderWithProbe(<FileMenu />);
    await user.click(screen.getByRole('button', { name: 'File' }));
    await waitFor(() => expect(status()).toHaveTextContent('active'));
    await user.click(document.body);
    await waitFor(() => expect(status()).toHaveTextContent('idle'));
  });

  it('UIC-PROVIDER-7.1 leaves tooltips and hover cards out', async () => {
    const user = userEvent.setup();
    const { status } = renderWithProbe(
      <>
        <Tooltip content="Save changes" delay={0}>
          <Button>Save</Button>
        </Tooltip>
        <HoverCardTrigger delay={0}>
          <Button>Profile</Button>
          <HoverCard aria-label="Profile card">Details</HoverCard>
        </HoverCardTrigger>
      </>,
    );
    // Keyboard focus opens both at once.
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Save changes');
    await user.tab();
    await screen.findByText('Details');
    await act(() => Promise.resolve());
    expect(status()).toHaveTextContent('idle');
  });

  it('UIC-PROVIDER-7.2 registers once in Strict Mode and leaves on unmount', async () => {
    const user = userEvent.setup();
    let presence: OverlayPresence | undefined;
    const { rerender } = render(
      <StrictMode>
        <UiProvider>
          <Probe name="Overlays" onPresence={(value) => (presence = value)} />
          <FileMenu />
        </UiProvider>
      </StrictMode>,
    );
    await user.click(screen.getByRole('button', { name: 'File' }));
    await screen.findByRole('menu', { name: 'File' });
    expect(presence?.getCount()).toBe(1);
    rerender(
      <StrictMode>
        <UiProvider>
          <Probe name="Overlays" onPresence={(value) => (presence = value)} />
        </UiProvider>
      </StrictMode>,
    );
    expect(presence?.getCount()).toBe(0);
  });

  it('UIC-PROVIDER-7.3 shares a store with nested providers and keeps separate trees apart', async () => {
    const user = userEvent.setup();
    render(
      <>
        <UiProvider>
          <Probe name="Outer" />
          <UiProvider>
            <FileMenu />
          </UiProvider>
        </UiProvider>
        <UiProvider>
          <Probe name="Separate" />
        </UiProvider>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'File' }));
    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Outer' })).toHaveTextContent('active'),
    );
    expect(screen.getByRole('status', { name: 'Separate' })).toHaveTextContent('idle');
  });
});
