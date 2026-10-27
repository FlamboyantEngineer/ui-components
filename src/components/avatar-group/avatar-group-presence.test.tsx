import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { UserCard } from '../user-card/user-card.js';
import { AvatarGroup, type AvatarGroupPerson } from './avatar-group.js';

const names = ['Maria Santos', 'Jon Berg', 'Lena Ortiz', 'Sam Okafor', 'Priya Nair', 'Tom Li'];
const people: AvatarGroupPerson[] = names.map((name, index) => ({ id: `p${index}`, name }));

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function personNames(container: HTMLElement): Array<string | null> {
  return Array.from(container.querySelectorAll('.ui-avatar-group__avatar')).map((element) =>
    element.getAttribute('aria-label'),
  );
}

describe('AvatarGroup', () => {
  it('UIC-AVATAR-GROUP-11.1 draws a presence avatar per person, in order, with their status', () => {
    const { container } = render(
      <AvatarGroup
        layout="strip"
        people={[
          { id: 'b', name: 'Jon Berg', status: 'active', statusLabel: 'Active', src: '/jon.png' },
          { id: 'a', name: 'Maria Santos', status: 'idle', colorIndex: 2, initials: 'MA' },
        ]}
      />,
    );
    const persons = container.querySelectorAll('.ui-avatar-group__avatar');
    expect(persons).toHaveLength(2);
    expect(persons[0]).toHaveClass('ui-avatar');
    expect(screen.getByRole('img', { name: 'Jon Berg, Active' })).toBeInTheDocument();
    expect(persons[0]).toHaveAttribute('data-status', 'active');
    expect(persons[0]?.querySelector('img')).toHaveAttribute('src', '/jon.png');
    expect(persons[1]).toHaveAttribute('data-status', 'idle');
    expect(persons[1]).toHaveAttribute('data-color', '2');
    expect(persons[1]?.querySelector('.ui-avatar__initials')).toHaveTextContent('MA');
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { slots: ['avatar'] });
  });

  it('UIC-AVATAR-GROUP-11.1 keeps each person element across renders and allows repeated ids', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, rerender } = render(
      <AvatarGroup layout="strip" people={people.slice(0, 3)} />,
    );
    const lena = screen.getByRole('img', { name: 'Lena Ortiz' });
    rerender(
      <AvatarGroup
        layout="strip"
        people={[people[2] as AvatarGroupPerson, people[0] as AvatarGroupPerson]}
      />,
    );
    expect(screen.getByRole('img', { name: 'Lena Ortiz' })).toBe(lena);
    expect(personNames(container)).toEqual(['Lena Ortiz', 'Maria Santos']);

    rerender(
      <AvatarGroup
        layout="strip"
        people={[
          { id: 'same', name: 'Maria Santos' },
          { id: 'same', name: 'Maria Santos' },
        ]}
      />,
    );
    expect(container.querySelectorAll('.ui-avatar-group__avatar')).toHaveLength(2);
    expect(errors).not.toHaveBeenCalled();
  });

  it('UIC-AVATAR-GROUP-11.2 windows the list and counts the rest with the caller overflow', () => {
    const { container, rerender } = render(
      <AvatarGroup
        layout="strip"
        people={people}
        maxVisible={4}
        overflowCount={1}
        hiddenNames={[' Ines ']}
      />,
    );
    expect(personNames(container)).toEqual(names.slice(0, 4));
    const overflow = container.querySelector('.ui-avatar-group__overflow');
    expect(overflow).toHaveTextContent('+3');
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { slots: ['avatar', 'overflow'] });

    rerender(<AvatarGroup layout="strip" people={people} />);
    expect(personNames(container)).toEqual(names);
    expect(container.querySelector('.ui-avatar-group__overflow')).toBeNull();

    rerender(<AvatarGroup layout="strip" people={people} maxVisible={2.9} overflowCount={-3} />);
    expect(personNames(container)).toHaveLength(2);
    expect(container.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+4');

    rerender(<AvatarGroup layout="strip" people={people} maxVisible={0} />);
    expect(personNames(container)).toHaveLength(0);
    expect(container.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+6');

    rerender(<AvatarGroup layout="strip" people={[]} overflowCount={2} />);
    expect(container.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+2');

    rerender(<AvatarGroup layout="strip" people={[]} overflowCount={0} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<AvatarGroup layout="strip" people={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-AVATAR-GROUP-11.3 names the group and the overflow with the people it hides', () => {
    const { rerender } = render(
      <AvatarGroup
        layout="strip"
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
      within(group).getByRole('img', {
        name: '3 more people: Priya Nair, Unnamed, Ines Duarte',
      }),
    ).toHaveTextContent('+3');

    rerender(
      <AvatarGroup layout="strip" people={people} maxVisible={5} aria-label=" People here " />,
    );
    expect(screen.getByRole('group')).toHaveAccessibleName('People here');
    expect(screen.getByRole('img', { name: '1 more person: Tom Li' })).toBeInTheDocument();

    rerender(<AvatarGroup layout="strip" people={[]} overflowCount={2} />);
    expect(screen.getByRole('group')).toHaveAccessibleName('2 more people');
    expect(screen.getByRole('img', { name: '2 more people' })).toBeInTheDocument();

    rerender(
      <UiProvider messages={{ morePeople: '{count} de plus' }}>
        <AvatarGroup layout="strip" people={people} maxVisible={1} aria-label="Ici" />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: '5 de plus' })).toBeInTheDocument();
  });

  it('UIC-AVATAR-GROUP-11.4 reports the pressed person once per click, Enter or Space', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { container, rerender } = render(
      <AvatarGroup layout="strip" people={people.slice(0, 3)} onAction={onAction} />,
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
    expectHooksMatchSpec(container, 'AVATAR-GROUP');

    rerender(<AvatarGroup layout="strip" people={people.slice(0, 3)} maxVisible={2} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[tabindex]')).toBeNull();
  });

  it('UIC-AVATAR-GROUP-11.5 opens the person card that renderCard returns', async () => {
    const user = userEvent.setup();

    const onAction = vi.fn();
    const { container } = render(
      <AvatarGroup
        layout="strip"
        people={people.slice(0, 3)}
        onAction={onAction}
        renderCard={(person) =>
          person.id === 'p2' ? null : <UserCard name={person.name} description={person.id} />
        }
      />,
    );
    const persons = container.querySelectorAll('.ui-avatar-group__avatar');
    expect(persons[0]).toHaveClass('ui-user-card__trigger');
    expect(persons[2]).not.toHaveClass('ui-user-card__trigger');
    await user.click(screen.getByRole('button', { name: 'Jon Berg' }));
    expect(onAction).toHaveBeenCalledWith('p1');
    const card = await screen.findByRole('dialog', { name: 'Jon Berg' });
    expect(card).toHaveTextContent('p1');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Lena Ortiz' }));
    expect(onAction).toHaveBeenLastCalledWith('p2');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { slots: ['avatar'] });
  });

  it('UIC-AVATAR-GROUP-11.6 opens a menu of the hidden people from the count', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const statuses: AvatarGroupPerson[] = people.map((person, index) =>
      index === 4 ? { ...person, status: 'away', statusLabel: 'Away', colorIndex: 3 } : person,
    );
    const { container } = render(
      <AvatarGroup
        layout="strip"
        people={statuses}
        maxVisible={4}
        overflowCount={1}
        hiddenNames={['Ines Duarte']}
        overflow="menu"
        onAction={onAction}
      />,
    );
    expect(root(container)).toHaveAttribute('data-overflow', 'menu');
    const count = screen.getByRole('button', {
      name: '3 more people: Priya Nair, Tom Li, Ines Duarte',
    });
    expect(count).toHaveClass('ui-avatar-group__overflow');
    expect(count).toHaveTextContent('+3');
    expect(count).toHaveAttribute('aria-haspopup', 'true');
    count.focus();
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu', { name: '3 more people' });
    expect(menu).toHaveClass('ui-menu', 'ui-avatar-group__menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items[0]).toHaveAccessibleName('Priya Nair Away');
    expect(items[1]).toHaveAccessibleName('Tom Li');
    const row = items[0]?.querySelector('.ui-user-identity') as HTMLElement;
    expect(row).toHaveAttribute('data-size', 'sm');
    expect(row).toHaveAttribute('data-status', 'away');
    expect(row.querySelector('.ui-avatar')).toHaveAttribute('data-color', '3');
    expectHooksMatchSpec(document.body, 'AVATAR-GROUP', { slots: ['overflow', 'menu'] });

    expect(items[0]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith('p5');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(count).toHaveFocus());
  });

  it('UIC-AVATAR-GROUP-11.6 keeps a plain count without hidden people, for dots and by default', async () => {
    const user = userEvent.setup();

    const { container, rerender } = render(
      <AvatarGroup layout="strip" people={[]} overflowCount={2} overflow="menu" />,
    );
    expect(screen.getByRole('img', { name: '2 more people' })).toHaveTextContent('+2');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<AvatarGroup people={people} maxVisible={2} layout="dots" overflow="menu" />);
    expect(container.querySelector('.ui-avatar-group__overflow')?.tagName).toBe('SPAN');
    expect(container.querySelector('button, [role]')).toBeNull();

    rerender(<AvatarGroup layout="strip" people={people} maxVisible={2} />);
    expect(root(container)).toHaveAttribute('data-overflow', 'count');
    expect(screen.getByRole('img', { name: /^4 more people/ })).toBeInTheDocument();

    const repeated = [people[0], people[0], people[0]] as AvatarGroupPerson[];
    rerender(<AvatarGroup layout="strip" people={repeated} maxVisible={1} overflow="menu" />);
    await user.click(screen.getByRole('button', { name: /^2 more people/ }));
    expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
  });

  it('UIC-AVATAR-GROUP-11.7 gives every person a name tooltip or a card on hover', () => {
    const { container, rerender } = render(
      <AvatarGroup layout="strip" people={people.slice(0, 2)} nameTooltip />,
    );
    const persons = container.querySelectorAll('.ui-avatar-group__avatar');
    expect(persons[0]).toHaveAttribute('tabindex', '0');
    expect(persons[0]).toHaveAttribute('role', 'img');
    expect(persons[1]).toHaveAccessibleName('Jon Berg');

    rerender(
      <AvatarGroup
        layout="strip"
        people={people.slice(0, 2)}
        cardTrigger="hover"
        renderCard={(person) => <UserCard name={person.name} />}
      />,
    );
    for (const person of container.querySelectorAll('.ui-avatar-group__avatar')) {
      expect(person).toHaveAttribute('aria-haspopup', 'dialog');
    }
  });

  it('UIC-AVATAR-GROUP-12.1 draws decorative colour dots inside another control', () => {
    const { container } = render(
      <button type="button" aria-label="Photos, 6 people here">
        Photos{' '}
        <AvatarGroup
          layout="dots"
          maxVisible={4}
          people={[...people, { id: 'g', name: 'Group', kind: 'group' }]}
          onAction={() => {}}
        />
      </button>,
    );
    const strip = container.querySelector('.ui-avatar-group') as HTMLElement;
    expect(strip).toHaveAttribute('data-layout', 'dots');
    expect(strip).toHaveAttribute('aria-hidden', 'true');
    expect(strip).not.toHaveAttribute('role');
    expect(strip).not.toHaveAttribute('aria-label');
    const dots = strip.querySelectorAll('.ui-avatar-group__dot');
    expect(dots).toHaveLength(4);
    expect(dots[0]).toHaveAttribute('data-color', String(getColorIndex('Maria Santos', 8)));
    expect(strip.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+3');
    expect(strip.querySelector('[role], [tabindex], button, [aria-label]')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expectHooksMatchSpec(strip, 'AVATAR-GROUP', { slots: ['dot', 'overflow'] });
  });

  it('UIC-AVATAR-GROUP-12.1 publishes the variant, avatars by default', () => {
    const { container } = render(<AvatarGroup layout="strip" people={people.slice(0, 1)} />);
    expect(root(container)).toHaveAttribute('data-layout', 'strip');
    expect(root(container).querySelector('.ui-avatar-group__dot')).toBeNull();
  });

  it('UIC-AVATAR-GROUP-12.2 sizes every avatar and passes the colour count', () => {
    const { container, rerender } = render(
      <AvatarGroup layout="strip" people={people.slice(0, 2)} />,
    );
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(
        <AvatarGroup layout="strip" people={people.slice(0, 2)} size={size} colorCount={50} />,
      );
      expect(root(container)).toHaveAttribute('data-size', size);
      for (const avatar of container.querySelectorAll('.ui-avatar')) {
        expect(avatar).toHaveAttribute('data-size', size);
      }
      expectHooksMatchSpec(container, 'AVATAR-GROUP');
    }
    expect(container.querySelector('.ui-avatar')).toHaveAttribute(
      'data-color',
      String(getColorIndex('Maria Santos', 50)),
    );
    rerender(<AvatarGroup people={people.slice(0, 2)} layout="dots" colorCount={50} />);
    expect(container.querySelector('.ui-avatar-group__dot')).toHaveAttribute(
      'data-color',
      String(getColorIndex('Maria Santos', 50)),
    );
  });

  it('UIC-AVATAR-GROUP-12.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <AvatarGroup
        layout="strip"
        people={people.slice(0, 1)}
        className="caller"
        id="strip-1"
        data-testid="probe"
        data-layout="spoofed"
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-avatar-group', 'caller');
    expect(element).toHaveAttribute('id', 'strip-1');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-layout', 'strip');
    expectHooksMatchSpec(container, 'AVATAR-GROUP');
  });
});
