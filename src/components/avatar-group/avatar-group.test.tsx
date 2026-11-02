import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { AvatarGroup, type AvatarGroupPerson } from './avatar-group.js';

const names = ['Maria Santos', 'Jon Berg', 'Lena Ortiz', 'Sam Okafor', 'Priya Nair', 'Tom Li'];
const people: AvatarGroupPerson[] = names.map((name, index) => ({ id: `p${index}`, name }));

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function avatarNames(container: HTMLElement): Array<string | null> {
  return Array.from(container.querySelectorAll('.ui-avatar-group__avatar')).map((element) =>
    element.getAttribute('aria-label'),
  );
}

describe('AvatarGroup', () => {
  it('UIC-AVATAR-GROUP-1.1 draws an avatar per person, in order, with the group options', () => {
    const { container } = render(
      <AvatarGroup
        people={[
          { id: 'b', name: 'Jon Berg', src: '/jon.png' },
          { id: 'a', name: 'Maria Santos', colorIndex: 2, initials: 'MA' },
        ]}
        size="sm"
        variant="outlined"
        colorCount={4}
      />,
    );
    const avatars = container.querySelectorAll('.ui-avatar-group__avatar');
    expect(avatars).toHaveLength(2);
    expect(avatars[0]).toHaveClass('ui-avatar');
    expect(avatars[0]).toHaveAttribute('data-size', 'sm');
    expect(avatars[0]).toHaveAttribute('data-variant', 'outlined');
    expect(avatars[0]?.querySelector('img')).toHaveAttribute('src', '/jon.png');
    expect(avatars[1]).toHaveAttribute('data-color', '2');
    expect(avatars[1]?.querySelector('.ui-avatar__initials')).toHaveTextContent('MA');
    expect(root(container)).toHaveAttribute('data-size', 'sm');
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { slots: ['avatar'] });
  });

  it('UIC-AVATAR-GROUP-1.1 keeps elements by id, allows repeated ids and renders nothing empty', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, rerender } = render(<AvatarGroup people={people.slice(0, 3)} />);
    const lena = screen.getByRole('img', { name: 'Lena Ortiz' });
    rerender(
      <AvatarGroup people={[people[2] as AvatarGroupPerson, people[0] as AvatarGroupPerson]} />,
    );
    expect(screen.getByRole('img', { name: 'Lena Ortiz' })).toBe(lena);
    expect(avatarNames(container)).toEqual(['Lena Ortiz', 'Maria Santos']);
    rerender(
      <AvatarGroup people={[people[0] as AvatarGroupPerson, people[0] as AvatarGroupPerson]} />,
    );
    expect(container.querySelectorAll('.ui-avatar-group__avatar')).toHaveLength(2);
    expect(errors).not.toHaveBeenCalled();
    rerender(<AvatarGroup people={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-AVATAR-GROUP-1.2 shows at most maxVisible avatars and counts the rest', () => {
    const { container, rerender } = render(<AvatarGroup people={people} maxVisible={4} />);
    expect(avatarNames(container)).toEqual(names.slice(0, 4));
    expect(container.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+2');
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { slots: ['avatar', 'overflow'] });
    rerender(<AvatarGroup people={people} />);
    expect(avatarNames(container)).toEqual(names);
    expect(container.querySelector('.ui-avatar-group__overflow')).toBeNull();
    rerender(<AvatarGroup people={people} maxVisible={2.7} />);
    expect(avatarNames(container)).toEqual(names.slice(0, 2));
    rerender(<AvatarGroup people={people} maxVisible={-1} />);
    expect(container.querySelectorAll('.ui-avatar-group__avatar')).toHaveLength(0);
    expect(container.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+6');
    rerender(<AvatarGroup people={people} maxVisible={Number.POSITIVE_INFINITY} />);
    expect(container.querySelector('.ui-avatar-group__overflow')).toBeNull();
  });

  it('UIC-AVATAR-GROUP-2.1 names the group, each avatar and the overflow', () => {
    const { container, rerender } = render(
      <AvatarGroup people={[...people.slice(0, 5), { id: 'x', name: '  ' }]} maxVisible={4} />,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAccessibleName(
      'Maria Santos, Jon Berg, Lena Ortiz, Sam Okafor, Priya Nair, Unnamed',
    );
    expect(root(container)).toHaveAttribute('data-action', 'none');
    expect(
      within(group).getByRole('img', { name: '2 more people: Priya Nair, Unnamed' }),
    ).toHaveTextContent('+2');
    expect(within(group).getByRole('img', { name: 'Jon Berg' })).toBeInTheDocument();
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    rerender(<AvatarGroup people={people} aria-label=" Reviewers " />);
    expect(screen.getByRole('group')).toHaveAccessibleName('Reviewers');
    rerender(
      <UiProvider messages={{ unnamed: 'Sans nom' }}>
        <AvatarGroup people={[{ id: 'x', name: '' }]} />
      </UiProvider>,
    );
    expect(screen.getByRole('group')).toHaveAccessibleName('Sans nom');
  });

  it('UIC-AVATAR-GROUP-2.2 lists everyone in a popover from a button', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AvatarGroup
        people={people.map((person, index) =>
          index === 1 ? { ...person, description: 'Reviewer' } : person,
        )}
        maxVisible={3}
        action="list"
      />,
    );
    expect(root(container)).toHaveAttribute('data-action', 'list');
    expect(screen.getByRole('group')).toHaveAccessibleName(names.join(', '));
    const trigger = screen.getByRole('button', {
      name: 'Maria Santos, Jon Berg, Lena Ortiz, 3 more people: Sam Okafor, Priya Nair, Tom Li',
    });
    expect(trigger).toHaveClass('ui-avatar-group__trigger');
    expect(trigger).not.toHaveAttribute('aria-label');
    expect(within(trigger).getAllByRole('img')).toHaveLength(4);
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { slots: ['trigger', 'avatar', 'overflow'] });

    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: '6 people' });
    expect(trigger).toHaveAttribute('data-pressed', 'true');
    const items = dialog.querySelectorAll('.ui-avatar-group__item');
    expect(
      Array.from(items, (item) => item.querySelector('.ui-user-identity__name')?.textContent),
    ).toEqual(names);
    expect(items[1]?.querySelector('.ui-user-identity__description')).toHaveTextContent('Reviewer');
    expect(dialog.closest('.ui-avatar-group__popover')).toHaveClass('ui-popover');
    expectHooksMatchSpec(document.body, 'AVATAR-GROUP', { slots: ['popover', 'list', 'item'] });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: '6 people' })).toBeInTheDocument();
  });

  it('UIC-AVATAR-GROUP-2.3 forwards the class name, caller attributes and id', () => {
    const { container } = render(
      <AvatarGroup people={people.slice(0, 2)} className="assignees" id="team" data-row="4" />,
    );
    expect(root(container)).toHaveClass('ui-avatar-group', 'assignees');
    expect(root(container)).toHaveAttribute('id', 'team');
    expect(root(container)).toHaveAttribute('data-row', '4');
    expectHooksMatchSpec(container, 'AVATAR-GROUP', { callerAttributes: ['data-row'] });
  });
  it('UIC-AVATAR-GROUP-3.1 offers overlapping, spaced and decorative-dot layouts', () => {
    const { container, rerender } = render(<AvatarGroup people={people} maxVisible={2} />);
    expect(container.querySelector('.ui-avatar-group')).toHaveAttribute('data-layout', 'stack');
    rerender(<AvatarGroup people={people} maxVisible={2} layout="strip" />);
    expect(screen.getByRole('group')).toHaveAttribute('data-layout', 'strip');
    rerender(<AvatarGroup people={people} maxVisible={2} layout="dots" />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.ui-avatar-group__dot')).toHaveLength(2);
    expect(container.querySelector('.ui-avatar-group')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('AvatarGroup root ref', () => {
  it('UIC-AVATAR-GROUP-2.3 forwards ref to its root', () => {
    const ref = { current: null as HTMLSpanElement | null };
    const { container } = render(<AvatarGroup ref={ref} people={people.slice(0, 2)} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector('.ui-avatar-group'));
  });
});
