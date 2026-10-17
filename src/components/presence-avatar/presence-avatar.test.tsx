import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { UserCard } from '../user-card/user-card.js';
import { PresenceAvatar } from './presence-avatar.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('PresenceAvatar', () => {
  it('UIC-PRESENCE-AVATAR-1.1 draws the avatar and publishes the status with a decorative indicator', () => {
    const { container, rerender } = render(
      <PresenceAvatar name="Maria Santos" status=" away " colorKey="user-1" />,
    );
    const element = root(container);
    expect(element).toHaveAttribute('data-status', 'away');
    const avatar = element.querySelector('.ui-avatar');
    expect(avatar).toHaveClass('ui-presence-avatar__avatar');
    expect(avatar).toHaveAttribute('data-color', String(getColorIndex('user-1', 8)));
    expect(element.querySelector('.ui-presence-avatar__indicator')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expectHooksMatchSpec(container, 'PRESENCE-AVATAR', { slots: 'all' });

    for (const status of ['active', 'busy', 'idle', 'reading-along']) {
      rerender(<PresenceAvatar name="Maria Santos" status={status} />);
      expect(root(container)).toHaveAttribute('data-status', status);
    }
    rerender(<PresenceAvatar name="Maria Santos" status="  " />);
    expect(root(container)).not.toHaveAttribute('data-status');
    expect(container.querySelector('.ui-presence-avatar__indicator')).toBeNull();
  });

  it('UIC-PRESENCE-AVATAR-1.1 passes picture, initials and colour to the avatar', () => {
    const { container, rerender } = render(
      <PresenceAvatar name="Jon Berg" src="/jon.png" colorIndex={4} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/jon.png');
    expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-color', '4');
    rerender(<PresenceAvatar name="Jon Berg" initials="BB" colorCount={50} colorKey="k" />);
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('BB');
    expect(container.querySelector('.ui-avatar')).toHaveAttribute(
      'data-color',
      String(getColorIndex('k', 50)),
    );
  });

  it('UIC-PRESENCE-AVATAR-1.2 names the avatar image by the name and status label', () => {
    const { container, rerender } = render(
      <PresenceAvatar name=" Maria Santos " status="away" statusLabel=" Away " />,
    );
    const image = screen.getByRole('img', { name: 'Maria Santos, Away' });
    expect(image).toHaveClass('ui-avatar', 'ui-presence-avatar__avatar');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(root(container)).not.toHaveAttribute('role');
    expect(root(container)).not.toHaveAttribute('aria-label');

    rerender(<PresenceAvatar name="Maria Santos" status="away" />);
    expect(screen.getByRole('img', { name: 'Maria Santos' })).toBeInTheDocument();
    rerender(<PresenceAvatar name="" statusLabel="Idle" />);
    expect(screen.getByRole('img', { name: 'Unnamed, Idle' })).toBeInTheDocument();
    rerender(
      <UiProvider strings={{ nameWithStatus: (name, status) => `${name} (${status})` }}>
        <PresenceAvatar name="Maria Santos" statusLabel="Absente" />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: 'Maria Santos (Absente)' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('UIC-PRESENCE-AVATAR-1.3 presses once for a click, Enter or Space and takes focus', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <PresenceAvatar name="Maria Santos" status="active" statusLabel="Active" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Maria Santos, Active' });
    expect(button).toHaveClass('ui-presence-avatar');
    expect(button).not.toHaveAttribute('aria-label');
    expect(within(button).getByRole('img', { name: 'Maria Santos, Active' })).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
    await user.keyboard('{Enter>3/}');
    expect(onPress).toHaveBeenCalledTimes(4);
    await user.keyboard('{Escape}');
    expect(onPress).toHaveBeenCalledTimes(4);

    await user.tab({ shift: true });
    await user.tab();
    expect(button).toHaveAttribute('data-focus-visible', 'true');
    await user.hover(button);
    expect(button).toHaveAttribute('data-hovered', 'true');
    expectHooksMatchSpec(container, 'PRESENCE-AVATAR');
  });

  it('UIC-PRESENCE-AVATAR-1.4 sizes the avatar, medium by default', () => {
    const { container, rerender } = render(<PresenceAvatar name="Jon Berg" />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<PresenceAvatar name="Jon Berg" size={size} status="active" />);
      expect(root(container)).toHaveAttribute('data-size', size);
      expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'PRESENCE-AVATAR');
    }
  });

  it('UIC-PRESENCE-AVATAR-1.5 appends the caller class and forwards id and data attributes', () => {
    const { container, rerender } = render(
      <PresenceAvatar
        name="Jon Berg"
        className="caller"
        id="presence-1"
        data-testid="probe"
        data-person="7"
      />,
    );
    let element = root(container);
    expect(element).toHaveClass('ui-presence-avatar', 'caller');
    expect(element).toHaveAttribute('id', 'presence-1');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-person', '7');
    expectHooksMatchSpec(container, 'PRESENCE-AVATAR', { callerAttributes: ['data-person'] });

    rerender(
      <PresenceAvatar
        name="Jon Berg"
        className="caller"
        id="presence-1"
        data-person="7"
        status="idle"
        onPress={() => {}}
      />,
    );
    element = root(container);
    expect(element.tagName).toBe('BUTTON');
    expect(element).toHaveClass('ui-presence-avatar', 'caller');
    expect(element).toHaveAttribute('id', 'presence-1');
    expect(element).toHaveAttribute('data-person', '7');
    expect(element).toHaveAttribute('data-status', 'idle');
    expectHooksMatchSpec(container, 'PRESENCE-AVATAR', { callerAttributes: ['data-person'] });
  });

  it('UIC-PRESENCE-AVATAR-1.6 opens its person card from the avatar and still presses', async () => {
    const onPress = vi.fn();
    const { container } = render(
      <PresenceAvatar
        name="Maria Santos"
        status="away"
        statusLabel="Away"
        size="sm"
        onPress={onPress}
        card={<UserCard name="Maria Santos" statusLabel="Away" />}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Maria Santos, Away' });
    expect(trigger).toBe(root(container));
    expect(trigger).toHaveClass('ui-presence-avatar', 'ui-user-card__trigger');
    expect(trigger).toHaveAttribute('data-size', 'sm');
    expect(trigger).toHaveAttribute('data-status', 'away');
    await userEvent.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    const card = await screen.findByRole('dialog', { name: 'Maria Santos' });
    expect(card).toHaveClass('ui-user-card');
    expectHooksMatchSpec(container, 'PRESENCE-AVATAR', { slots: ['avatar', 'indicator'] });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
