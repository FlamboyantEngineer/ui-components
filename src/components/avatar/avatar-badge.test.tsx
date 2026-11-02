import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UserCard } from '../user-card/user-card.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import { Avatar } from './avatar.js';

// A stand-in for the flag image a host supplies.
const flag = (
  <img src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'/%3E" alt="" />
);

const badgeOf = (container: HTMLElement) => container.querySelector('.ui-avatar__badge');

describe('Avatar corner badge', () => {
  it('UIC-AVATAR-4.2 draws the badge outside the surface, hidden and inert, on its corner', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" badge={flag} />);
    const badge = badgeOf(container);
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveAttribute('inert');
    expect(badge).toHaveAttribute('data-placement', 'bottom-end');
    expect(badge?.parentElement).toHaveClass('ui-avatar');
    expect(container.querySelector('.ui-avatar__surface .ui-avatar__badge')).toBeNull();
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['surface', 'initials', 'badge'] });
    // Without a label the badge leaves the name alone.
    expect(screen.getByRole('img', { name: 'Maria Santos' })).toBeInTheDocument();

    rerender(<Avatar name="Maria Santos" badge={flag} badgePlacement="top-start" />);
    expect(badgeOf(container)).toHaveAttribute('data-placement', 'top-start');
    rerender(<Avatar name="Maria Santos" badge={null} />);
    expect(badgeOf(container)).toBeNull();
  });

  it('UIC-AVATAR-4.2 gives the status indicator its corner and names the badge after the status', () => {
    const { container, rerender } = render(
      <Avatar name="Maria Santos" status="away" badge={flag} badgeLabel=" France " />,
    );
    expect(badgeOf(container)).toHaveAttribute('data-placement', 'top-end');
    expect(container.querySelector('.ui-avatar__indicator')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Maria Santos, Away, France' })).toBeInTheDocument();

    rerender(
      <Avatar
        name="Maria Santos"
        status="away"
        badge={flag}
        badgeLabel="France"
        badgePlacement="bottom-start"
      />,
    );
    expect(badgeOf(container)).toHaveAttribute('data-placement', 'bottom-start');
    rerender(<Avatar name="Maria Santos" badge={flag} badgeLabel="France" label="Maria" />);
    expect(screen.getByRole('img', { name: 'Maria' })).toBeInTheDocument();
  });

  it('UIC-AVATAR-4.2 adds no focus target to a pressable avatar and keeps its press', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <>
        <Avatar name="Maria Santos" badge={flag} badgeLabel="France" onPress={onPress} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    const button = screen.getByRole('button', { name: 'Maria Santos, France' });
    expect(button).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    // The badge carries no state of the trigger's.
    const badge = badgeOf(container);
    expect(badge?.getAttributeNames().sort()).toEqual([
      'aria-hidden',
      'class',
      'data-placement',
      'inert',
    ]);
  });

  it('UIC-USER-IDENTITY-1.8 reads the badge after the name and status, from a decorative avatar', () => {
    const { container } = render(
      <UserIdentity name="Maria Santos" status="busy" badge={flag} badgeLabel="France" />,
    );
    expect(container.querySelector('.ui-avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(badgeOf(container)).toHaveAttribute('data-placement', 'top-end');
    // The identity draws its own indicator, so the avatar draws none.
    expect(container.querySelector('.ui-avatar__indicator')).toBeNull();
    const label = container.querySelector('.ui-user-identity__badge-label');
    expect(label).toHaveAttribute('role', 'img');
    expect(label).toHaveAccessibleName('France');
    expect(container.querySelector('.ui-user-identity__indicator')?.nextElementSibling).toBe(label);
    expectHooksMatchSpec(container, 'USER-IDENTITY');
  });

  it('UIC-USER-CARD-1.1 passes the badge to its identity row', () => {
    render(
      <UserCard name="Maria Santos" badge={flag} badgeLabel="France" badgePlacement="top-start" />,
    );
    const card = screen.getByRole('dialog', { name: 'Maria Santos' });
    expect(card.querySelector('.ui-avatar__badge')).toHaveAttribute('data-placement', 'top-start');
    expect(within(card).getByRole('img', { name: 'France' })).toBeInTheDocument();
  });
});
