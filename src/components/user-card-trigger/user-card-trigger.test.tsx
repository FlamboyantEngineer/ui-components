import { EditGlyph } from '../../core/glyphs.js';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ShadowHost, deepActive, inShadow } from '../../../test/shadow-fixtures.js';
import { Avatar } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { Modal, ModalTrigger } from '../modal/modal.js';
import { PortalHost } from '../portal/portal.js';
import { UserCard } from '../user-card/user-card.js';
import { UserCardTrigger } from './user-card-trigger.js';

const actions = [
  { id: 'message', label: 'Message', icon: EditGlyph },
  { id: 'profile', label: 'View profile' },
];

describe('UserCardTrigger', () => {
  function renderTrigger(props: Partial<Parameters<typeof UserCardTrigger>[0]> = {}) {
    const onAction = vi.fn();
    const view = render(
      <>
        <UserCardTrigger
          card={<UserCard name="Maria Santos" actions={actions} onAction={onAction} />}
          {...props}
        >
          <Avatar name="Maria Santos" size="sm" />
        </UserCardTrigger>
        <button type="button">Outside</button>
      </>,
    );
    return { ...view, onAction };
  }

  it('UIC-USER-CARD-TRIGGER-1.1 wraps its content in a button named by that content', async () => {
    const onPress = vi.fn();
    const { container } = renderTrigger({
      className: 'caller',
      id: 'trigger-1',
      'data-testid': 'probe',
      onPress,
    });
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    expect(trigger).toHaveClass('ui-user-card-trigger', 'caller');
    expect(trigger).toHaveAttribute('id', 'trigger-1');
    expect(trigger).toHaveAttribute('data-testid', 'probe');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('.ui-avatar')).not.toBeNull();
    await userEvent.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(container.contains(screen.getByRole('dialog'))).toBe(false);
    expectHooksMatchSpec(document.body, 'USER-CARD-TRIGGER', { slots: ['popover'] });
  });

  it('UIC-USER-CARD-TRIGGER-1.5 is a plain button without a card and keeps it when one arrives', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(
      <UserCardTrigger card={null} onPress={onPress}>
        Maria Santos
      </UserCardTrigger>,
    );
    const button = screen.getByRole('button', { name: 'Maria Santos' });
    expect(button).not.toHaveAttribute('aria-haspopup');
    expect(button).not.toHaveAttribute('aria-expanded');
    expect(button).not.toHaveClass('ui-user-card-trigger');
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <UserCardTrigger card={<UserCard name="Maria Santos" />} onPress={onPress}>
        Maria Santos
      </UserCardTrigger>,
    );
    expect(screen.getByRole('button', { name: 'Maria Santos' })).toBe(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: 'Maria Santos' })).toBeInTheDocument();
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('UIC-USER-CARD-TRIGGER-1.1 publishes the disabled state and stays closed', async () => {
    renderTrigger({ isDisabled: true });
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    expect(trigger).toHaveAttribute('data-disabled', 'true');
    await userEvent.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-USER-CARD-TRIGGER-1.2 opens the card in a popover and closes it on Escape and outside press', async () => {
    renderTrigger();
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Maria Santos' });
    expect(dialog.closest('.ui-user-card-trigger__popover')).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expectHooksMatchSpec(document.body, 'USER-CARD-TRIGGER', { slots: ['popover'] });
    expectHooksMatchSpec(document.body, 'USER-CARD', { slots: ['actions'] });

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Outside', hidden: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-USER-CARD-1.4 UIC-USER-CARD-TRIGGER-1.2 closes the card before reporting an action', async () => {
    const { onAction } = renderTrigger();
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    trigger.focus();
    await userEvent.keyboard(' ');
    await userEvent.click(await screen.findByRole('button', { name: 'Message' }));
    expect(onAction).toHaveBeenCalledWith('message');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-USER-CARD-1.4 UIC-USER-CARD-1.5 leaves a containing modal open and its focus alone', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ModalTrigger>
        <Button>Edit</Button>
        <Modal title="Editor">
          <input aria-label="Draft" />
          <UserCard name="Maria Santos" actions={actions} onAction={onAction} />
        </Modal>
      </ModalTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const draft = await screen.findByRole('textbox', { name: 'Draft' });
    await waitFor(() => expect(draft).toHaveFocus());
    const card = screen.getByRole('dialog', { name: 'Maria Santos' });
    expect(card.tagName).toBe('SECTION');
    await user.type(draft, 'Notes');
    await user.click(within(card).getByRole('button', { name: 'Message' }));
    expect(onAction).toHaveBeenCalledWith('message');
    expect(screen.getByRole('dialog', { name: 'Editor' })).toBeInTheDocument();
    expect(draft).toHaveValue('Notes');
    expect(within(card).getByRole('button', { name: 'Message' })).toHaveFocus();
  });
});

let user: ReturnType<typeof userEvent.setup>;

/**
 * Fake timers with a user-event session. Testing Library drains a zero timeout after each user-event
 * call and advances it only under Jest's fake timers, so it is pointed at Vitest's clock here.
 */
function useFakeClock() {
  vi.useFakeTimers();
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

/** Moves the mouse across the page and onto `element`, so React Aria sees a pointer before the hover. */
async function hover(element: Element) {
  await user.pointer({ target: document.body });
  await user.hover(element);
}

/** Reaches `element` with Tab, as a keyboard user does, stepping back first if it has focus. */
async function tabTo(element: HTMLElement) {
  if (element === document.activeElement) await user.tab({ shift: true });
  for (let step = 0; step < 10 && document.activeElement !== element; step += 1) {
    await user.tab();
  }
  expect(element).toHaveFocus();
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('UserCardTrigger opening', () => {
  afterEach(async () => {
    // Let React Aria's global warm-up and cool-down timers settle between tests.
    if (vi.isFakeTimers()) await advance(5000);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function renderHoverTrigger(props: Partial<Parameters<typeof UserCardTrigger>[0]> = {}) {
    return render(
      <>
        <button type="button">Before</button>
        <UserCardTrigger
          trigger="hover"
          card={<UserCard name="Maria Santos" actions={actions} />}
          {...props}
        >
          <Avatar name="Maria Santos" size="sm" />
        </UserCardTrigger>
      </>,
    );
  }

  it('UIC-USER-CARD-TRIGGER-1.3 opens on hover after the delay without taking focus, then closes', async () => {
    useFakeClock();
    const onPress = vi.fn();
    renderHoverTrigger({ delay: 300, closeDelay: 100, onPress });
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await hover(trigger);
    await advance(299);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await advance(1);
    const dialog = screen.getByRole('dialog', { name: 'Maria Santos' });
    expect(dialog.closest('.ui-user-card-trigger__popover')).toHaveAttribute(
      'data-trigger',
      'PreviewTrigger',
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await advance(1000);
    expect(dialog.contains(document.activeElement)).toBe(false);
    expectHooksMatchSpec(document.body, 'USER-CARD-TRIGGER', { slots: ['popover'] });

    await user.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Escape}');
    await advance(100);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-USER-CARD-TRIGGER-1.3 opens on keyboard focus after the delay and Tab moves into the card', async () => {
    useFakeClock();
    renderHoverTrigger({ delay: 300 });
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    await tabTo(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await advance(300);
    expect(screen.getByRole('dialog', { name: 'Maria Santos' })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Escape}');
    await advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await tabTo(trigger);
    await advance(300);
    const dialog = screen.getByRole('dialog', { name: 'Maria Santos' });
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toHaveClass('ui-user-card__action');
  });

  it('UIC-USER-CARD-1.4 UIC-USER-CARD-TRIGGER-1.3 closes a hover card before reporting its action', async () => {
    useFakeClock();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <UserCardTrigger
        trigger="hover"
        delay={0}
        onOpenChange={onOpenChange}
        card={<UserCard name="Maria Santos" actions={actions} onAction={onAction} />}
      >
        <Avatar name="Maria Santos" size="sm" />
      </UserCardTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    await hover(trigger);
    await advance(0);
    const dialog = screen.getByRole('dialog', { name: 'Maria Santos' });
    await user.click(within(dialog).getByRole('button', { name: 'Message' }));
    expect(onAction).toHaveBeenCalledWith('message');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await tabTo(trigger);
    await advance(0);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Message' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledTimes(2);
    await advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('UIC-USER-CARD-1.4 UIC-USER-CARD-TRIGGER-1.3 returns focus from a hover card action inside a shadow root', async () => {
    const onAction = vi.fn();
    render(
      <ShadowHost name="people">
        <PortalHost>
          <UserCardTrigger
            trigger="hover"
            defaultOpen
            card={<UserCard name="Maria Santos" actions={actions} onAction={onAction} />}
          >
            <Avatar name="Maria Santos" size="sm" />
          </UserCardTrigger>
        </PortalHost>
      </ShadowHost>,
    );
    const message = await waitFor(() =>
      inShadow('people').getByRole('button', { name: 'Message' }),
    );
    act(() => message.focus());
    // React Aria presses need its shadow DOM flag, off in unit tests (UIC-PORTAL-1.8).
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.click(message);
    expect(onAction).toHaveBeenCalledWith('message');
    await waitFor(() => expect(inShadow('people').queryByRole('dialog')).not.toBeInTheDocument());
    expect(deepActive()).toBe(inShadow('people').getByRole('button', { name: 'Maria Santos' }));
  });

  it('UIC-USER-CARD-TRIGGER-1.3 stays closed while disabled', async () => {
    useFakeClock();
    renderHoverTrigger({ isDisabled: true, delay: 0 });
    await hover(screen.getByRole('button', { name: 'Maria Santos' }));
    await advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-USER-CARD-TRIGGER-1.4 follows a controlled open state in either mode', async () => {
    const onOpenChange = vi.fn();
    function Controlled({ trigger }: { trigger: 'press' | 'hover' }) {
      const [isOpen, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(!isOpen)}>
            Toggle
          </button>
          <UserCardTrigger
            trigger={trigger}
            isOpen={isOpen}
            onOpenChange={(open) => {
              onOpenChange(open);
              setOpen(open);
            }}
            card={<UserCard name="Maria Santos" />}
          >
            Maria Santos
          </UserCardTrigger>
        </>
      );
    }
    const { unmount } = render(<Controlled trigger="press" />);
    expect(screen.getByRole('dialog', { name: 'Maria Santos' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Maria Santos' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    unmount();

    render(<Controlled trigger="hover" />);
    expect(screen.getByRole('dialog', { name: 'Maria Santos' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle', hidden: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('UIC-USER-CARD-TRIGGER-1.4 opens at first with defaultOpen', () => {
    render(
      <UserCardTrigger defaultOpen card={<UserCard name="Maria Santos" />}>
        Maria Santos
      </UserCardTrigger>,
    );
    expect(screen.getByRole('dialog', { name: 'Maria Santos' })).toBeInTheDocument();
  });
});
