import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Avatar } from '../avatar/avatar.js';
import { UserCard, UserCardTrigger } from './user-card.js';

const actions = [
  { id: 'message', label: 'Message', icon: 'edit' as const },
  { id: 'profile', label: 'View profile' },
];

function card(container: HTMLElement): HTMLElement {
  return container.querySelector('.ui-user-card') as HTMLElement;
}

describe('UserCard', () => {
  it('UIC-USER-CARD-1.1 draws the identity row with the avatar, name and secondary line', () => {
    const { container } = render(
      <UserCard
        name="Maria Santos"
        description="maria@example.com"
        src="/maria.png"
        colorKey="u1"
      />,
    );
    const identity = card(container).querySelector('.ui-user-card__identity');
    expect(identity).toHaveClass('ui-user-identity');
    expect(identity?.querySelector('.ui-user-identity__name')).toHaveTextContent('Maria Santos');
    expect(identity?.querySelector('.ui-user-identity__description')).toHaveTextContent(
      'maria@example.com',
    );
    expect(identity?.querySelector('img')).toHaveAttribute('src', '/maria.png');
    expectHooksMatchSpec(container, 'USER-CARD', { slots: ['identity'] });
  });

  it('UIC-USER-CARD-1.1 draws a group glyph, initials and the unnamed fallback as text', () => {
    const { container, rerender } = render(<UserCard name="Design team" kind="group" />);
    expect(container.querySelector('.ui-avatar__glyph')).not.toBeNull();
    rerender(<UserCard name="<b>Jon</b>" initials="JB" colorIndex={3} />);
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('JB');
    expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-color', '3');
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('<b>Jon</b>')).toBeInTheDocument();
    rerender(
      <UiProvider strings={{ unnamed: 'Someone' }}>
        <UserCard name="  " />
      </UiProvider>,
    );
    expect(screen.getByRole('dialog', { name: 'Someone' })).toHaveTextContent('Someone');
  });

  it('UIC-USER-CARD-1.2 publishes the status word and draws a status row for a label', () => {
    const { container, rerender } = render(<UserCard name="Jon Berg" status=" away " />);
    expect(card(container)).toHaveAttribute('data-status', 'away');
    expect(container.querySelector('.ui-user-card__status')).toBeNull();

    rerender(<UserCard name="Jon Berg" status="active" statusLabel=" Editing " />);
    const row = container.querySelector('.ui-user-card__status') as HTMLElement;
    expect(row.querySelector('.ui-user-card__indicator')).toHaveAttribute('aria-hidden', 'true');
    expect(row.querySelector('.ui-user-card__status-label')).toHaveTextContent(/^Editing$/);
    expectHooksMatchSpec(container, 'USER-CARD', {
      slots: ['status', 'indicator', 'status-label'],
    });

    rerender(<UserCard name="Jon Berg" status="  " statusLabel="  " />);
    expect(card(container)).not.toHaveAttribute('data-status');
    expect(container.querySelector('.ui-user-card__status')).toBeNull();
  });

  it('UIC-USER-CARD-1.3 draws one description row per detail, in order', () => {
    const { container, rerender } = render(
      <UserCard
        name="Lena Ortiz"
        details={[
          { label: 'Team', value: 'Research' },
          { label: 'Local time', value: <time dateTime="09:30">09:30</time> },
        ]}
      />,
    );
    const list = container.querySelector('.ui-user-card__details') as HTMLElement;
    expect(list).toHaveClass('ui-description-list');
    const terms = Array.from(list.querySelectorAll('dt')).map((term) => term.textContent);
    expect(terms).toEqual(['Team', 'Local time']);
    expect(list.querySelector('time')).toHaveTextContent('09:30');
    expectHooksMatchSpec(container, 'USER-CARD', { slots: ['details'] });

    rerender(<UserCard name="Lena Ortiz" details={[]} />);
    expect(container.querySelector('.ui-user-card__details')).toBeNull();
  });

  it('UIC-USER-CARD-1.4 draws an action button per action and reports its id once', async () => {
    const onAction = vi.fn();
    const { container, rerender } = render(
      <UserCard name="Sam Okafor" actions={actions} onAction={onAction} />,
    );
    const group = container.querySelector('.ui-user-card__actions') as HTMLElement;
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Message', 'View profile']);
    expect(buttons[0]).toHaveClass('ui-button', 'ui-user-card__action');
    expect(buttons[0]).toHaveAttribute('data-size', 'sm');
    expect(buttons[0]?.querySelector('.ui-button__start-icon [data-glyph="edit"]')).not.toBeNull();
    expect(buttons[1]?.querySelector('.ui-button__start-icon')).toBeNull();
    await userEvent.click(buttons[1] as HTMLElement);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith('profile');
    expectHooksMatchSpec(container, 'USER-CARD', { slots: ['actions', 'action'] });

    rerender(<UserCard name="Sam Okafor" actions={[]} />);
    expect(container.querySelector('.ui-user-card__actions')).toBeNull();
  });

  it('UIC-USER-CARD-1.5 is a dialog named by the person with decorative media', () => {
    const { container, rerender } = render(
      <UserCard name=" Priya Nair " statusLabel="Away" description="Design" />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Priya Nair' });
    expect(dialog).toBe(card(container));
    expect(dialog.querySelector('.ui-avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(within(dialog).queryByRole('img')).toBeNull();
    rerender(<UserCard name="Priya Nair" aria-label="Profile of Priya Nair" />);
    expect(screen.getByRole('dialog', { name: 'Profile of Priya Nair' })).toBeInTheDocument();
  });

  it('UIC-USER-CARD-1.6 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <UserCard
        name="Tom Li"
        className="caller"
        id="card-1"
        data-testid="probe"
        data-status="ignored"
        status="idle"
      />,
    );
    const root = card(container);
    expect(root).toHaveClass('ui-user-card', 'caller');
    expect(root).toHaveAttribute('id', 'card-1');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-status', 'idle');
    expectHooksMatchSpec(container, 'USER-CARD');
  });
});

describe('UserCardTrigger', () => {
  function renderTrigger(props: Partial<Parameters<typeof UserCardTrigger>[0]> = {}) {
    const onAction = vi.fn();
    const result = render(
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
    return { ...result, onAction };
  }

  it('UIC-USER-CARD-2.1 wraps its content in a button named by that content', async () => {
    const onPress = vi.fn();
    const { container } = renderTrigger({
      className: 'caller',
      id: 'trigger-1',
      'data-testid': 'probe',
      onPress,
    });
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    expect(trigger).toHaveClass('ui-user-card__trigger', 'caller');
    expect(trigger).toHaveAttribute('id', 'trigger-1');
    expect(trigger).toHaveAttribute('data-testid', 'probe');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('.ui-avatar')).not.toBeNull();
    await userEvent.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(container.contains(screen.getByRole('dialog'))).toBe(false);
    expectHooksMatchSpec(document.body, 'USER-CARD', { slots: ['trigger', 'popover'] });
  });

  it('UIC-USER-CARD-2.1 publishes the disabled state and stays closed', async () => {
    renderTrigger({ isDisabled: true });
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    expect(trigger).toHaveAttribute('data-disabled', 'true');
    await userEvent.click(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('UIC-USER-CARD-2.2 opens the card in a popover and closes it on Escape and outside press', async () => {
    renderTrigger();
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Maria Santos' });
    expect(dialog.closest('.ui-user-card__popover')).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expectHooksMatchSpec(document.body, 'USER-CARD', { slots: ['popover', 'actions'] });

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Outside', hidden: true }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('UIC-USER-CARD-1.4 UIC-USER-CARD-2.2 closes the card before reporting an action', async () => {
    const { onAction } = renderTrigger();
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    trigger.focus();
    await userEvent.keyboard(' ');
    await userEvent.click(await screen.findByRole('button', { name: 'Message' }));
    expect(onAction).toHaveBeenCalledWith('message');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
