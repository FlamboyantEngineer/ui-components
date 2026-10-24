import { act, render, screen, waitFor, within } from '@testing-library/react';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { PeoplePicker, type PeoplePickerLoader, type PeoplePickerPerson } from './people-picker.js';

const directory: PeoplePickerPerson[] = [
  { id: 'ada', name: 'Ada Moreno', description: 'ada@example.com' },
  { id: 'ben', name: 'Ben Okafor', description: 'ben@example.com' },
  { id: 'cleo', name: 'Cleo Varga', isDisabled: true, disabledReason: 'Account inactive' },
  { id: 'design', name: 'Design team', kind: 'group', description: '8 members' },
];

const me: PeoplePickerPerson = { id: 'me', name: 'Sam Rivera', description: 'sam@example.com' };

function findPeople(query: string) {
  const needle = query.toLowerCase();
  return directory.filter((person) => person.name.toLowerCase().includes(needle));
}

function input() {
  return screen.getByRole('combobox');
}

function optionNames() {
  return screen
    .queryAllByRole('option')
    .map((option) => option.querySelector('.ui-user-identity__title')?.textContent);
}

/** Replaces the search text in one input event, as a paste does, so each query loads once. */
async function setText(user: UserEvent, text: string) {
  await user.clear(input());
  if (text) await user.paste(text);
}

describe('PeoplePicker', () => {
  it('UIC-PEOPLE-PICKER-1.1 UIC-PEOPLE-PICKER-3.4 renders a combobox field with the caller hooks', () => {
    const { container } = render(
      <PeoplePicker
        label="Owner"
        description="Who answers for it"
        errorMessage="Choose an owner"
        placeholder="Search people"
        isInvalid
        isRequired
        size="lg"
        className="caller"
        id="owner"
        loadItems={async () => []}
      />,
    );
    const root = container.querySelector('.ui-people-picker');
    expect(root).toHaveClass('ui-combobox', 'ui-people-picker', 'caller');
    expect(input()).toHaveAttribute('id', 'owner');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-invalid', 'true');
    expect(input()).toHaveAccessibleName('Owner');
    expect(input()).toHaveAttribute('placeholder', 'Search people');
    expect(input()).toBeRequired();
    expect(container.querySelector('.ui-combobox__description')).toHaveTextContent(
      'Who answers for it',
    );
    expect(container.querySelector('.ui-combobox__error')).toHaveTextContent('Choose an owner');
    expectHooksMatchSpec(container, 'PEOPLE-PICKER');
  });

  it('UIC-PEOPLE-PICKER-1.1 hands disabled and read-only states to the combobox', () => {
    const { rerender } = render(<PeoplePicker aria-label="Owner" isDisabled loadItems={vi.fn()} />);
    expect(input()).toBeDisabled();
    rerender(<PeoplePicker aria-label="Owner" isReadOnly loadItems={vi.fn()} />);
    expect(input()).toHaveAttribute('readonly');
  });

  it('UIC-PEOPLE-PICKER-1.2 UIC-PEOPLE-PICKER-2.1 UIC-PEOPLE-PICKER-3.1 searches and picks one person', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const loadItems = vi.fn<PeoplePickerLoader>(async (query) => findPeople(query));
    render(
      <PeoplePicker label="Owner" loadItems={loadItems} searchDelay={0} onChange={onChange} />,
    );
    await user.click(input());
    await setText(user, 'ad');
    await waitFor(() => expect(optionNames()).toEqual(['Ada Moreno']));
    expect(loadItems).toHaveBeenCalledWith('ad', expect.any(AbortSignal));
    const option = screen.getByRole('option', { name: /Ada Moreno/ });
    const row = option.querySelector('.ui-people-picker__person');
    expect(row).toHaveClass('ui-user-identity');
    expect(row).toHaveAttribute('data-kind', 'person');
    expect(row).toHaveAttribute('data-size', 'sm');
    expect(row?.querySelector('.ui-avatar')).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(document.body, 'PEOPLE-PICKER', { slots: ['person'] });
    await user.click(option);
    expect(onChange).toHaveBeenLastCalledWith('ada');
    expect(input()).toHaveValue('Ada Moreno');
  });

  it('UIC-PEOPLE-PICKER-1.2 UIC-PEOPLE-PICKER-2.2 shows chosen people and groups as chips with avatars', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <PeoplePicker
        label="Reviewers"
        selectionMode="multiple"
        loadItems={async (query) => ({ items: findPeople(query) })}
        searchDelay={0}
        onChange={onChange}
      />,
    );
    await user.click(input());
    await setText(user, 'e');
    const design = await screen.findByRole('option', { name: /Design team/ });
    expect(design.querySelector('.ui-people-picker__person')).toHaveAttribute('data-kind', 'group');
    await user.click(design);
    await setText(user, 'ben');
    await user.click(await screen.findByRole('option', { name: /Ben Okafor/ }));
    expect(onChange).toHaveBeenLastCalledWith(['design', 'ben']);
    await user.keyboard('{Escape}');
    const chips = screen.getByRole('grid', { name: 'Reviewers selected values' });
    const group = within(chips).getByRole('row', { name: 'Design team' });
    const avatar = group.querySelector('.ui-combobox__chip-icon .ui-people-picker__avatar');
    expect(avatar).toHaveClass('ui-avatar');
    expect(avatar).toHaveAttribute('data-kind', 'group');
    expect(within(chips).getByRole('row', { name: 'Ben Okafor' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'PEOPLE-PICKER', { slots: ['avatar'] });
  });

  it('UIC-PEOPLE-PICKER-2.3 lists a disabled person with the reason and does not pick them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PeoplePicker
        label="Owner"
        loadItems={async (query) => findPeople(query)}
        searchDelay={0}
        onChange={onChange}
      />,
    );
    await user.click(input());
    await setText(user, 'cleo');
    const option = await screen.findByRole('option', { name: /Cleo Varga/ });
    expect(option).toHaveAttribute('aria-disabled', 'true');
    expect(option).toHaveTextContent('Account inactive');
    await user.click(option);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-PEOPLE-PICKER-3.2 UIC-PEOPLE-PICKER-3.3 lists the current user and recent people before a search', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const loadItems = vi.fn<PeoplePickerLoader>(async (query) => [...findPeople(query), me]);
    render(
      <PeoplePicker
        label="Owner"
        currentUser={me}
        recent={[directory[1] as PeoplePickerPerson, me]}
        loadItems={loadItems}
        searchDelay={0}
        onChange={onChange}
      />,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    expect(optionNames()).toEqual(['Sam Rivera (you)', 'Ben Okafor']);
    expect(loadItems).not.toHaveBeenCalled();
    expect(screen.getByText('Recent')).toHaveClass('ui-combobox__section-header');
    const self = screen.getByRole('option', { name: /Sam Rivera \(you\)/ });
    expect(within(self).getByText('(you)')).toHaveClass('ui-people-picker__you');
    expectHooksMatchSpec(document.body, 'PEOPLE-PICKER', { slots: ['person', 'you'] });
    await setText(user, 'o');
    await waitFor(() => expect(loadItems).toHaveBeenCalledWith('o', expect.any(AbortSignal)));
    await waitFor(() => expect(screen.queryByText('Recent')).not.toBeInTheDocument());
    expect(screen.getByRole('option', { name: /Sam Rivera \(you\)/ })).toBeInTheDocument();
    await setText(user, '');
    await user.click(await screen.findByRole('option', { name: /Sam Rivera/ }));
    expect(onChange).toHaveBeenLastCalledWith('me');
  });

  it('UIC-PEOPLE-PICKER-3.5 names known people of a saved value and lists them before a search', async () => {
    const user = userEvent.setup();
    const loadItems = vi.fn<PeoplePickerLoader>(async (query) => findPeople(query));
    const ada = directory[0] as PeoplePickerPerson;
    const ben = directory[1] as PeoplePickerPerson;
    render(
      <PeoplePicker
        label="Reviewers"
        selectionMode="multiple"
        currentUser={me}
        knownPeople={[me, ada]}
        recent={[ada, ben]}
        defaultValue={['ada']}
        loadItems={loadItems}
      />,
    );
    const chips = screen.getByRole('grid', { name: 'Reviewers selected values' });
    expect(within(chips).getByRole('row', { name: 'Ada Moreno' })).toBeInTheDocument();
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    expect(optionNames()).toEqual(['Sam Rivera (you)', 'Ada Moreno', 'Ben Okafor']);
    expect(loadItems).not.toHaveBeenCalled();
  });

  it('UIC-PEOPLE-PICKER-3.1 keeps a searched person known after later results leave them out', async () => {
    const user = userEvent.setup();
    let release: (people: PeoplePickerPerson[]) => void = () => {};
    const loadItems = vi.fn<PeoplePickerLoader>((query) =>
      query === 'ad'
        ? Promise.resolve(findPeople(query))
        : new Promise((resolve) => {
            release = resolve;
          }),
    );
    render(
      <PeoplePicker
        label="Reviewers"
        selectionMode="multiple"
        loadItems={loadItems}
        searchDelay={0}
      />,
    );
    await user.click(input());
    await setText(user, 'ad');
    await user.click(await screen.findByRole('option', { name: /Ada Moreno/ }));
    await setText(user, 'zz');
    await waitFor(() => expect(loadItems).toHaveBeenCalledTimes(2));
    act(() => release([]));
    expect(await screen.findByText('No results')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    const chips = screen.getByRole('grid', { name: 'Reviewers selected values' });
    const chip = within(chips).getByRole('row', { name: 'Ada Moreno' });
    expect(chip.querySelector('.ui-people-picker__avatar')).not.toBeNull();
  });
});
