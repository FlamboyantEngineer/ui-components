import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { UserCard } from '../user-card/user-card.js';
import { Attribution } from './attribution.js';

const fixedNow = new Date(2026, 4, 23, 10, 30);
const getNow = () => fixedNow;
const fiveMinutesAgo = new Date(2026, 4, 23, 10, 25).toISOString();
const maria = { name: 'Maria Santos', colorKey: 'user-1' };

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('Attribution', () => {
  afterEach(async () => {
    if (vi.isFakeTimers()) {
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
    }
    vi.useRealTimers();
  });

  it('UIC-ATTRIBUTION-1.1 fills the default template with the time and the person', () => {
    const { container } = render(
      <Attribution time={fiveMinutesAgo} person={maria} getNow={getNow} />,
    );
    const element = root(container);
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveClass('ui-attribution');
    expect(element).toHaveTextContent(/^5 minutes ago by Maria Santos$/);
    expect(element.querySelector('.ui-attribution__time')).toHaveClass('ui-relative-time');
    expect(element.querySelector('.ui-attribution__time')).toHaveAttribute(
      'datetime',
      fiveMinutesAgo,
    );
    expect(
      element.querySelector('.ui-attribution__person > .ui-attribution__name'),
    ).toHaveTextContent('Maria Santos');
    expectHooksMatchSpec(container, 'ATTRIBUTION', { slots: ['time', 'person', 'name'] });
  });

  it('UIC-ATTRIBUTION-1.1 uses the caller template, the time alone and the provider string', () => {
    const { container, rerender } = render(
      <Attribution
        time="2026-05-22"
        getNow={getNow}
        person={maria}
        template="{person}, {time} {x}"
      />,
    );
    expect(root(container)).toHaveTextContent(/^Maria Santos, yesterday \{x\}$/);
    rerender(<Attribution time="2026-05-22" getNow={getNow} />);
    expect(root(container)).toHaveTextContent(/^Yesterday$/);
    expect(container.querySelector('.ui-attribution__person')).toBeNull();
    rerender(
      <UiProvider messages={{ attribution: '{person} · {time}' }}>
        <Attribution time="2026-05-22" getNow={getNow} person={maria} />
      </UiProvider>,
    );
    expect(container.querySelector('.ui-attribution')).toHaveTextContent(
      /^Maria Santos · yesterday$/,
    );
  });

  it('UIC-ATTRIBUTION-1.2 capitalizes the time only at the start and reads missing times', () => {
    const { container, rerender } = render(
      <Attribution time="2026-05-22" getNow={getNow} person={maria} template="Edited {time}" />,
    );
    expect(root(container)).toHaveTextContent(/^Edited yesterday$/);
    rerender(
      <Attribution time="2026-05-19" getNow={getNow} person={maria} fallbackAfterDays={3} />,
    );
    expect(root(container)).toHaveTextContent(/^May 19, 2026 by Maria Santos$/);
    rerender(<Attribution time={null} person={maria} template="Edited {time} by {person}" />);
    expect(root(container)).toHaveTextContent(/^Edited unknown time by Maria Santos$/);
    rerender(<Attribution time="later" person={maria} />);
    expect(root(container)).toHaveTextContent(/^Unknown time by Maria Santos$/);
    expect(container.querySelector('.ui-attribution__time')).toHaveAttribute('data-empty', 'true');
  });

  it('UIC-ATTRIBUTION-1.3 draws the avatar on request and reads blank names as unnamed', () => {
    const { container, rerender } = render(
      <Attribution time="2026-05-22" getNow={getNow} person={maria} showAvatar />,
    );
    const avatar = container.querySelector('.ui-attribution__avatar');
    expect(avatar).toHaveClass('ui-avatar');
    expect(avatar).toHaveAttribute('data-size', 'xs');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar?.nextElementSibling).toHaveClass('ui-attribution__name');
    expectHooksMatchSpec(container, 'ATTRIBUTION', { slots: 'all' });
    rerender(<Attribution time="2026-05-22" getNow={getNow} person={{ name: '  ' }} showAvatar />);
    expect(container.querySelector('.ui-attribution__name')).toHaveTextContent('Unnamed');
    rerender(<Attribution time="2026-05-22" getNow={getNow} template="{time} by {person}" />);
    expect(container.querySelector('.ui-attribution__avatar')).toBeNull();
    expect(container.querySelector('.ui-attribution__name')).toHaveTextContent('Unnamed');
  });

  it('UIC-ATTRIBUTION-1.4 opens the person card from the name', async () => {
    const user = userEvent.setup();
    render(
      <Attribution
        time="2026-05-22"
        getNow={getNow}
        person={maria}
        card={<UserCard name="Maria Santos" description="Research" />}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Maria Santos' });
    expect(trigger).toHaveClass('ui-attribution__person', 'ui-user-card__trigger');
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Maria Santos' })).toHaveTextContent('Research');
  });

  it('UIC-ATTRIBUTION-1.4 opens the card on hover with cardTrigger="hover"', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <Attribution
        time="2026-05-22"
        getNow={getNow}
        person={maria}
        card={<UserCard name="Maria Santos" />}
        cardTrigger="hover"
      />,
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.hover(screen.getByRole('button', { name: 'Maria Santos' }));
    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByRole('dialog', { name: 'Maria Santos' })).toBeInTheDocument();
  });

  it('UIC-ATTRIBUTION-1.5 forwards the class, id and data attributes', () => {
    const { container } = render(
      <Attribution time="2026-05-22" getNow={getNow} className="extra" id="edited" data-row="2" />,
    );
    expect(root(container)).toHaveClass('ui-attribution', 'extra');
    expect(root(container)).toHaveAttribute('id', 'edited');
    expect(root(container)).toHaveAttribute('data-row', '2');
    expectHooksMatchSpec(container, 'ATTRIBUTION', { callerAttributes: ['data-row'] });
  });

  it('UIC-ATTRIBUTION-1.6 adds no role or name; the time tooltip is the only tab stop', () => {
    const { container } = render(
      <Attribution time={fiveMinutesAgo} person={maria} getNow={getNow} />,
    );
    expect(root(container)).not.toHaveAttribute('role');
    expect(root(container)).not.toHaveAttribute('aria-label');
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(container.querySelector('[tabindex="0"]')).toHaveClass('ui-attribution__time');
  });
});
