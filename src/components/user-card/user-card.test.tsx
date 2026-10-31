import { EditGlyph } from '../../core/glyphs.js';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { UserCard } from './user-card.js';

const actions = [
  { id: 'message', label: 'Message', icon: EditGlyph },
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
      <UiProvider messages={{ unnamed: 'Someone' }}>
        <UserCard name="  " />
      </UiProvider>,
    );
    expect(screen.getByRole('dialog', { name: 'Someone' })).toHaveTextContent('Someone');
  });

  it('UIC-USER-CARD-1.2 publishes the status and draws a status row named by its label', () => {
    const { container, rerender } = render(<UserCard name="Jon Berg" status="away" />);
    expect(card(container)).toHaveAttribute('data-status', 'away');
    expect(container.querySelector('.ui-user-card__status-label')).toHaveTextContent(/^Away$/);

    rerender(<UserCard name="Jon Berg" status="active" statusLabel=" Editing " />);
    const row = container.querySelector('.ui-user-card__status') as HTMLElement;
    expect(row.querySelector('.ui-user-card__indicator')).toHaveAttribute('aria-hidden', 'true');
    expect(row.querySelector('.ui-user-card__status-label')).toHaveTextContent(/^Editing$/);
    expectHooksMatchSpec(container, 'USER-CARD', {
      slots: ['status', 'indicator', 'status-label'],
    });

    rerender(<UserCard name="Jon Berg" statusLabel="  " />);
    expect(card(container)).not.toHaveAttribute('data-status');
    expect(container.querySelector('.ui-user-card__status')).toBeNull();
  });

  it('UIC-USER-CARD-1.3 draws one description row per detail, in order', () => {
    const { container, rerender } = render(
      <UserCard
        name="Lena Ortiz"
        details={[
          { id: 'team', label: 'Team', value: 'Research' },
          { id: 'time', label: 'Local time', value: <time dateTime="09:30">09:30</time> },
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
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    rerender(<UserCard name="Priya Nair" aria-label="Profile of Priya Nair" />);
    expect(screen.getByRole('dialog', { name: 'Profile of Priya Nair' })).toBeInTheDocument();
  });

  it('UIC-USER-CARD-1.5 takes no focus when rendered in place', async () => {
    const user = userEvent.setup();
    function Reveal() {
      const [isShown, setShown] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setShown(true)}>
            Show details
          </button>
          {isShown ? <UserCard name="Maria Santos" actions={actions} /> : null}
        </>
      );
    }
    render(<Reveal />);
    const button = screen.getByRole('button', { name: 'Show details' });
    await user.click(button);
    const dialog = await screen.findByRole('dialog', { name: 'Maria Santos' });
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(button).toHaveFocus();
    expect(dialog).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Message' })).toHaveFocus();
  });

  it('UIC-USER-CARD-1.7 shows a skeleton and is busy while the profile loads', () => {
    const { container, rerender } = render(
      <UserCard
        name="Lena Ortiz"
        description="Research"
        statusLabel="Away"
        details={[{ id: 'team', label: 'Team', value: 'Research' }]}
        actions={actions}
        isLoading
      />,
    );
    const root = card(container);
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(root).toHaveAttribute('aria-busy', 'true');
    const skeleton = root.querySelector('.ui-user-card__skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass('ui-skeleton');
    expect(skeleton).toHaveAttribute('data-loading', 'true');
    expect(root.querySelector('.ui-user-identity__name')).toHaveTextContent('Lena Ortiz');
    expect(
      root.querySelector('.ui-user-card__status, .ui-user-card__details, .ui-user-card__actions'),
    ).toBeNull();
    expectHooksMatchSpec(container, 'USER-CARD', { slots: ['identity', 'skeleton'] });

    rerender(<UserCard name="Lena Ortiz" statusLabel="Away" />);
    expect(card(container)).not.toHaveAttribute('data-loading');
    expect(card(container)).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.ui-user-card__skeleton')).toBeNull();
    expect(container.querySelector('.ui-user-card__status')).not.toBeNull();
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
