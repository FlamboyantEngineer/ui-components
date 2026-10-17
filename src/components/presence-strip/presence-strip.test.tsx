import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { UserCard } from '../user-card/user-card.js';
import { PresenceStrip, type PresencePerson } from './presence-strip.js';

const names = ['Maria Santos', 'Jon Berg', 'Lena Ortiz', 'Sam Okafor', 'Priya Nair', 'Tom Li'];
const people: PresencePerson[] = names.map((name, index) => ({ id: `p${index}`, name }));

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function personNames(container: HTMLElement): Array<string | null> {
  return Array.from(container.querySelectorAll('.ui-presence-strip__person > .ui-avatar')).map(
    (element) => element.getAttribute('aria-label'),
  );
}

describe('PresenceStrip', () => {
  it('UIC-PRESENCE-STRIP-1.1 draws a presence avatar per person, in order, with their status', () => {
    const { container } = render(
      <PresenceStrip
        people={[
          { id: 'b', name: 'Jon Berg', status: 'active', statusLabel: 'Active', src: '/jon.png' },
          { id: 'a', name: 'Maria Santos', status: 'idle', colorIndex: 2, initials: 'MA' },
        ]}
      />,
    );
    const persons = container.querySelectorAll('.ui-presence-strip__person');
    expect(persons).toHaveLength(2);
    expect(persons[0]).toHaveClass('ui-presence-avatar');
    expect(
      within(persons[0] as HTMLElement).getByRole('img', { name: 'Jon Berg, Active' }),
    ).toBeInTheDocument();
    expect(persons[0]).toHaveAttribute('data-status', 'active');
    expect(persons[0]?.querySelector('img')).toHaveAttribute('src', '/jon.png');
    expect(persons[1]).toHaveAttribute('data-status', 'idle');
    expect(persons[1]?.querySelector('.ui-avatar')).toHaveAttribute('data-color', '2');
    expect(persons[1]?.querySelector('.ui-avatar__initials')).toHaveTextContent('MA');
    expectHooksMatchSpec(container, 'PRESENCE-STRIP', { slots: ['person'] });
  });

  it('UIC-PRESENCE-STRIP-1.1 keeps each person element across renders and allows repeated ids', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, rerender } = render(<PresenceStrip people={people.slice(0, 3)} />);
    const lena = screen.getByRole('img', { name: 'Lena Ortiz' });
    rerender(<PresenceStrip people={[people[2] as PresencePerson, people[0] as PresencePerson]} />);
    expect(screen.getByRole('img', { name: 'Lena Ortiz' })).toBe(lena);
    expect(personNames(container)).toEqual(['Lena Ortiz', 'Maria Santos']);

    rerender(
      <PresenceStrip
        people={[
          { id: 'same', name: 'Maria Santos' },
          { id: 'same', name: 'Maria Santos' },
        ]}
      />,
    );
    expect(container.querySelectorAll('.ui-presence-strip__person')).toHaveLength(2);
    expect(errors).not.toHaveBeenCalled();
  });

  it('UIC-PRESENCE-STRIP-1.2 windows the list and counts the rest with the caller overflow', () => {
    const { container, rerender } = render(
      <PresenceStrip people={people} maxVisible={4} overflowCount={1} hiddenNames={[' Ines ']} />,
    );
    expect(personNames(container)).toEqual(names.slice(0, 4));
    const overflow = container.querySelector('.ui-presence-strip__overflow');
    expect(overflow).toHaveTextContent('+3');
    expectHooksMatchSpec(container, 'PRESENCE-STRIP', { slots: ['person', 'overflow'] });

    rerender(<PresenceStrip people={people} />);
    expect(personNames(container)).toEqual(names);
    expect(container.querySelector('.ui-presence-strip__overflow')).toBeNull();

    rerender(<PresenceStrip people={people} maxVisible={2.9} overflowCount={-3} />);
    expect(personNames(container)).toHaveLength(2);
    expect(container.querySelector('.ui-presence-strip__overflow')).toHaveTextContent('+4');

    rerender(<PresenceStrip people={people} maxVisible={0} />);
    expect(personNames(container)).toHaveLength(0);
    expect(container.querySelector('.ui-presence-strip__overflow')).toHaveTextContent('+6');

    rerender(<PresenceStrip people={[]} overflowCount={2} />);
    expect(container.querySelector('.ui-presence-strip__overflow')).toHaveTextContent('+2');

    rerender(<PresenceStrip people={[]} overflowCount={0} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PresenceStrip people={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-PRESENCE-STRIP-1.3 names the group and the overflow with the people it hides', () => {
    const { rerender } = render(
      <PresenceStrip
        people={[...people.slice(0, 5), { id: 'blank', name: '  ' }]}
        maxVisible={4}
        overflowCount={1}
        hiddenNames={[' Ines Duarte ', ' ']}
      />,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Unnamed, Ines Duarte',
    );
    expect(
      within(group).getByRole('img', { name: '3 more people: Priya Nair, Unnamed, Ines Duarte' }),
    ).toHaveTextContent('+3');

    rerender(<PresenceStrip people={people} maxVisible={5} aria-label=" People here " />);
    expect(screen.getByRole('group')).toHaveAccessibleName('People here');
    expect(screen.getByRole('img', { name: '1 more person: Tom Li' })).toBeInTheDocument();

    rerender(<PresenceStrip people={[]} overflowCount={2} />);
    expect(screen.getByRole('group')).toHaveAccessibleName('2 more people');
    expect(screen.getByRole('img', { name: '2 more people' })).toBeInTheDocument();

    rerender(
      <UiProvider strings={{ morePeople: (count) => `${count} de plus` }}>
        <PresenceStrip people={people} maxVisible={1} aria-label="Ici" />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: '5 de plus' })).toBeInTheDocument();
  });

  it('UIC-PRESENCE-STRIP-1.4 reports the pressed person once per click, Enter or Space', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { container, rerender } = render(
      <PresenceStrip people={people.slice(0, 3)} onAction={onAction} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Jon Berg' }));
    expect(onAction).toHaveBeenLastCalledWith('p1');
    expect(screen.getByRole('button', { name: 'Jon Berg' })).toHaveFocus();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('p2');
    await user.keyboard(' ');
    await user.keyboard('{Enter>3/}');
    await user.keyboard('{Escape}');
    expect(onAction).toHaveBeenCalledTimes(4);
    expectHooksMatchSpec(container, 'PRESENCE-STRIP');

    rerender(<PresenceStrip people={people.slice(0, 3)} maxVisible={2} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[tabindex]')).toBeNull();
  });

  it('UIC-PRESENCE-STRIP-1.5 opens the person card that renderCard returns', async () => {
    const onAction = vi.fn();
    const { container } = render(
      <PresenceStrip
        people={people.slice(0, 3)}
        onAction={onAction}
        renderCard={(person) =>
          person.id === 'p2' ? null : <UserCard name={person.name} description={person.id} />
        }
      />,
    );
    const persons = container.querySelectorAll('.ui-presence-strip__person');
    expect(persons[0]).toHaveClass('ui-user-card__trigger');
    expect(persons[2]).not.toHaveClass('ui-user-card__trigger');
    await userEvent.click(screen.getByRole('button', { name: 'Jon Berg' }));
    expect(onAction).toHaveBeenCalledWith('p1');
    const card = await screen.findByRole('dialog', { name: 'Jon Berg' });
    expect(card).toHaveTextContent('p1');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Lena Ortiz' }));
    expect(onAction).toHaveBeenLastCalledWith('p2');
    expect(screen.queryByRole('dialog')).toBeNull();
    expectHooksMatchSpec(container, 'PRESENCE-STRIP', { slots: ['person'] });
  });

  it('UIC-PRESENCE-STRIP-2.1 draws decorative colour dots inside another control', () => {
    const { container } = render(
      <button type="button" aria-label="Photos, 6 people here">
        Photos{' '}
        <PresenceStrip
          variant="dots"
          maxVisible={4}
          people={[...people, { id: 'g', name: 'Group', kind: 'group' }]}
          onAction={() => {}}
        />
      </button>,
    );
    const strip = container.querySelector('.ui-presence-strip') as HTMLElement;
    expect(strip).toHaveAttribute('data-variant', 'dots');
    expect(strip).toHaveAttribute('aria-hidden', 'true');
    expect(strip).not.toHaveAttribute('role');
    expect(strip).not.toHaveAttribute('aria-label');
    const dots = strip.querySelectorAll('.ui-presence-strip__dot');
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveAttribute('data-color', String(getColorIndex('Maria Santos', 8)));
    expect(strip.querySelector('.ui-presence-strip__overflow')).toHaveTextContent('+3');
    expect(strip.querySelector('[role], [tabindex], button, [aria-label]')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expectHooksMatchSpec(strip, 'PRESENCE-STRIP', { slots: ['dot', 'overflow'] });
  });

  it('UIC-PRESENCE-STRIP-2.1 publishes the variant, avatars by default', () => {
    const { container } = render(<PresenceStrip people={people.slice(0, 1)} />);
    expect(root(container)).toHaveAttribute('data-variant', 'avatars');
    expect(root(container).querySelector('.ui-presence-strip__dot')).toBeNull();
  });

  it('UIC-PRESENCE-STRIP-2.2 sizes every avatar and passes the colour count', () => {
    const { container, rerender } = render(<PresenceStrip people={people.slice(0, 2)} />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<PresenceStrip people={people.slice(0, 2)} size={size} colorCount={50} />);
      expect(root(container)).toHaveAttribute('data-size', size);
      for (const avatar of container.querySelectorAll('.ui-presence-avatar')) {
        expect(avatar).toHaveAttribute('data-size', size);
      }
      expectHooksMatchSpec(container, 'PRESENCE-STRIP');
    }
    expect(container.querySelector('.ui-avatar')).toHaveAttribute(
      'data-color',
      String(getColorIndex('Maria Santos', 50)),
    );
    rerender(<PresenceStrip people={people.slice(0, 2)} variant="dots" colorCount={50} />);
    expect(container.querySelector('.ui-presence-strip__dot')).toHaveAttribute(
      'data-color',
      String(getColorIndex('Maria Santos', 50)),
    );
  });

  it('UIC-PRESENCE-STRIP-2.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <PresenceStrip
        people={people.slice(0, 1)}
        className="caller"
        id="strip-1"
        data-testid="probe"
        data-variant="spoofed"
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-presence-strip', 'caller');
    expect(element).toHaveAttribute('id', 'strip-1');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-variant', 'avatars');
    expectHooksMatchSpec(container, 'PRESENCE-STRIP');
  });
});
