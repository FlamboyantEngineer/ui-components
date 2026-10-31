import { act, render, screen, waitFor, within } from '@testing-library/react';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { UserCard } from '../user-card/user-card.js';
import { Avatar } from './avatar.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('Avatar', () => {
  it('UIC-AVATAR-11.1 draws the avatar and publishes the status with a decorative indicator', () => {
    const { container, rerender } = render(
      <Avatar name="Maria Santos" status="away" colorKey="user-1" />,
    );
    const element = root(container);
    expect(element).toHaveAttribute('data-status', 'away');
    const avatar = element;
    expect(avatar.querySelector('.ui-avatar__surface')).toBeInTheDocument();
    expect(avatar).toHaveAttribute('data-color', String(getColorIndex('user-1', 8)));
    expect(element.querySelector('.ui-avatar__indicator')).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['surface', 'initials', 'indicator'] });

    for (const status of ['active', 'busy', 'idle'] as const) {
      rerender(<Avatar name="Maria Santos" status={status} />);
      expect(root(container)).toHaveAttribute('data-status', status);
    }
    rerender(<Avatar name="Maria Santos" />);
    expect(root(container)).not.toHaveAttribute('data-status');
    expect(container.querySelector('.ui-avatar__indicator')).toBeNull();
  });

  it('UIC-AVATAR-11.1 passes picture, initials and colour to the avatar', () => {
    const { container, rerender } = render(
      <Avatar name="Jon Berg" src="/jon.png" colorIndex={4} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/jon.png');
    expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-color', '4');
    rerender(<Avatar name="Jon Berg" initials="BB" colorCount={50} colorKey="k" />);
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('BB');
    expect(container.querySelector('.ui-avatar')).toHaveAttribute(
      'data-color',
      String(getColorIndex('k', 50)),
    );
  });

  it('UIC-AVATAR-11.2 names the avatar image by the name and status label', () => {
    const { container, rerender } = render(
      <Avatar name=" Maria Santos " status="away" statusLabel=" Away " />,
    );
    const image = screen.getByRole('img', { name: 'Maria Santos, Away' });
    expect(image).toHaveClass('ui-avatar');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(root(container)).toHaveAttribute('role', 'img');
    expect(root(container)).toHaveAccessibleName('Maria Santos, Away');

    rerender(<Avatar name="Maria Santos" status="away" />);
    expect(screen.getByRole('img', { name: 'Maria Santos, Away' })).toBeInTheDocument();
    rerender(<Avatar name="Maria Santos" status="busy" statusLabel="In a meeting" />);
    expect(screen.getByRole('img', { name: 'Maria Santos, In a meeting' })).toBeInTheDocument();
    rerender(<Avatar name="Maria Santos" />);
    expect(screen.getByRole('img', { name: 'Maria Santos' })).toBeInTheDocument();
    rerender(<Avatar name="" statusLabel="Idle" />);
    expect(screen.getByRole('img', { name: 'Unnamed, Idle' })).toBeInTheDocument();
    rerender(
      <UiProvider messages={{ nameWithStatus: '{name} ({status})' }}>
        <Avatar name="Maria Santos" statusLabel="Absente" />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: 'Maria Santos (Absente)' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-AVATAR-11.3 presses once for a click, Enter or Space and takes focus', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <Avatar name="Maria Santos" status="active" statusLabel="Active" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Maria Santos, Active' });
    expect(button).toHaveClass('ui-avatar');
    expect(button).toHaveAccessibleName('Maria Santos, Active');
    expect(within(button).getByRole('img', { name: 'Maria Santos, Active' })).toBeInTheDocument();
    expect(button).toHaveAccessibleName('Maria Santos, Active');
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
    expectHooksMatchSpec(container, 'AVATAR');
  });

  it('UIC-AVATAR-11.4 sizes the avatar, medium by default', () => {
    const { container, rerender } = render(<Avatar name="Jon Berg" />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<Avatar name="Jon Berg" size={size} status="active" />);
      expect(root(container)).toHaveAttribute('data-size', size);
      expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'AVATAR');
    }
  });

  it('UIC-AVATAR-11.5 appends the caller class and forwards id and data attributes', () => {
    const { container, rerender } = render(
      <Avatar
        name="Jon Berg"
        className="caller"
        id="presence-1"
        data-testid="probe"
        data-person="7"
      />,
    );
    let element = root(container);
    expect(element).toHaveClass('ui-avatar', 'caller');
    expect(element).toHaveAttribute('id', 'presence-1');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-person', '7');
    expectHooksMatchSpec(container, 'AVATAR', { callerAttributes: ['data-person'] });

    rerender(
      <Avatar
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
    expect(element).toHaveClass('ui-avatar', 'caller');
    expect(element).toHaveAttribute('id', 'presence-1');
    expect(element).toHaveAttribute('data-person', '7');
    expect(element).toHaveAttribute('data-status', 'idle');
    expectHooksMatchSpec(container, 'AVATAR', { callerAttributes: ['data-person'] });
  });

  it('UIC-AVATAR-11.6 opens its person card from the avatar and still presses', async () => {
    const user = userEvent.setup();

    const onPress = vi.fn();
    const { container } = render(
      <Avatar
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
    expect(trigger).toHaveClass('ui-avatar', 'ui-user-card-trigger');
    expect(trigger).toHaveAttribute('data-size', 'sm');
    expect(trigger).toHaveAttribute('data-status', 'away');
    await user.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    const card = await screen.findByRole('dialog', { name: 'Maria Santos' });
    expect(card).toHaveClass('ui-user-card');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['surface', 'indicator'] });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

/** Moves the mouse across the page onto the element, so React Aria reads a pointer modality on enter. */
async function hover(user: UserEvent, element: Element) {
  await user.pointer({ target: document.body });
  await user.hover(element);
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

describe('Avatar tooltips and hover cards', () => {
  afterEach(async () => {
    // Let React Aria's global warm-up and cool-down timers settle between tests.
    if (vi.isFakeTimers()) await advance(5000);
    vi.useRealTimers();
  });

  it('UIC-AVATAR-11.7 makes a static avatar a focusable image with a name tooltip', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <Avatar name="Maria Santos" status="away" statusLabel="Away" nameTooltip />,
    );
    const image = screen.getByRole('img', { name: 'Maria Santos, Away' });
    expect(image).toBe(root(container));
    expect(image).toHaveClass('ui-avatar');
    expect(image).toHaveAttribute('tabindex', '0');
    expect(image.querySelector('.ui-avatar__initials')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    await hover(user, image);
    await advance(500);
    expect(tooltip()).toHaveTextContent('Maria Santos, Away');
    expect(image.getAttribute('aria-describedby') ?? '').toBe('');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['surface', 'indicator'] });
    await user.unhover(image);
    await advance(1000);
    expect(tooltip()).toBeNull();

    await user.tab();
    expect(image).toHaveFocus();
    expect(tooltip()).toHaveTextContent('Maria Santos, Away');
  });

  it('UIC-AVATAR-11.7 shows the name of a pressable avatar without renaming it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onPress = vi.fn();
    render(
      <>
        <Avatar name="Jon Berg" nameTooltip onPress={onPress} />
        <Avatar
          name="Lena Ortiz"
          statusLabel="Busy"
          nameTooltip
          card={<UserCard name="Lena Ortiz" />}
        />
      </>,
    );
    const button = screen.getByRole('button', { name: 'Jon Berg' });
    expect(button).toHaveAccessibleName('Jon Berg');
    await user.tab();
    expect(button).toHaveFocus();
    expect(tooltip()).toHaveTextContent('Jon Berg');
    expect(button).toHaveAttribute('aria-describedby', '');
    act(() => button.blur());
    await advance(1000);

    const cardTrigger = screen.getByRole('button', { name: 'Lena Ortiz, Busy' });
    await hover(user, cardTrigger);
    await advance(500);
    expect(tooltip()).toHaveTextContent('Lena Ortiz, Busy');
    expect(cardTrigger).toHaveAttribute('aria-describedby', '');
  });

  it('UIC-AVATAR-11.8 opens its card on hover and focus instead of showing a tooltip', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onPress = vi.fn();
    const { container } = render(
      <Avatar
        name="Maria Santos"
        statusLabel="Away"
        nameTooltip
        cardTrigger="hover"
        onPress={onPress}
        card={<UserCard name="Maria Santos" statusLabel="Away" />}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Maria Santos, Away' });
    expect(trigger).toBe(root(container));
    expect(trigger).toHaveClass('ui-avatar', 'ui-user-card-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await hover(user, trigger);
    await advance(600);
    const card = screen.getByRole('dialog', { name: 'Maria Santos' });
    expect(card.closest('.ui-user-card-trigger__popover')).toHaveAttribute(
      'data-trigger',
      'PreviewTrigger',
    );
    expect(tooltip()).toBeNull();
    expect(card.contains(document.activeElement)).toBe(false);
    await user.click(trigger);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
    await user.keyboard('{Escape}');
    await advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-AVATAR-11.9 keeps the focused button while a card or name tooltip comes and goes', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const card = <UserCard name="Alice" />;
    const { rerender } = render(<Avatar name="Alice" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Alice' });
    await user.tab();
    expect(button).toHaveFocus();
    expect(button).not.toHaveClass('ui-user-card-trigger');
    expect(button).not.toHaveAttribute('aria-expanded');

    const steps = [
      { card },
      { card, cardTrigger: 'hover' as const },
      { card: undefined, nameTooltip: true },
      { card, nameTooltip: true },
      {},
    ];
    for (const step of steps) {
      rerender(<Avatar name="Alice" onPress={onPress} {...step} />);
      expect(screen.getByRole('button', { name: 'Alice' })).toBe(button);
      expect(button).toHaveFocus();
      if (step.card) expect(button).toHaveClass('ui-user-card-trigger');
      else expect(button).not.toHaveClass('ui-user-card-trigger');
    }

    rerender(<Avatar name="Alice" onPress={onPress} card={card} />);
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('dialog', { name: 'Alice' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveFocus());
  });
});
