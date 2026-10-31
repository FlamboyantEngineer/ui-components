import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { SearchField } from '../search-field/search-field.js';
import {
  FilterBar,
  type FilterBarProps,
  type FilterCondition,
  type FilterField,
} from './filter-bar.js';

const fields: FilterField[] = [
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'pages', label: 'Pages', type: 'number' },
  {
    id: 'genre',
    label: 'Genre',
    type: 'choice',
    options: [
      { value: 'history', label: 'History' },
      { value: 'travel', label: 'Travel' },
    ],
  },
  { id: 'available', label: 'Available', type: 'boolean' },
];

const genre: FilterCondition = { field: 'genre', operator: 'any-of', value: ['history', 'travel'] };
const pages: FilterCondition = { field: 'pages', operator: 'at-least', value: null };

// An open editor hides the page from assistive technology, so chips are found by their hook.
const chipsInDocument = () => [...document.querySelectorAll('.ui-filter-bar__chip')];

function Controlled(
  props: Partial<FilterBarProps> & { onValue?: (value: FilterCondition[]) => void },
) {
  const [value, setValue] = useState<FilterCondition[]>([genre, pages]);
  return (
    <FilterBar
      fields={fields}
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onValue?.(next);
      }}
    />
  );
}

describe('FilterBar', () => {
  it('UIC-FILTER-BAR-2.1 UIC-FILTER-BAR-4.1 reads each condition on a chip in a named group', () => {
    render(
      <FilterBar
        fields={fields}
        defaultValue={[genre, pages, { field: 'colour', operator: 'equals', value: 'red' }]}
      />,
    );
    const bar = screen.getByRole('group', { name: 'Filters' });
    const chips = within(bar).getAllByRole('listitem');
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveAttribute('data-field', 'genre');
    expect(chips[0]).not.toHaveAttribute('data-incomplete');
    expect(chips[1]).toHaveAttribute('data-incomplete', 'true');
    const button = within(requireDefined(chips[0])).getByRole('button', {
      name: 'Genre is any of History, Travel',
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(requireDefined(chips[0]).querySelector('.ui-filter-bar__chip-field')).toHaveTextContent(
      'Genre',
    );
    expect(
      requireDefined(chips[0]).querySelector('.ui-filter-bar__chip-operator'),
    ).toHaveTextContent('is any of');
    expect(requireDefined(chips[0]).querySelector('.ui-filter-bar__chip-value')).toHaveTextContent(
      'History, Travel',
    );
    expect(
      within(requireDefined(chips[1])).getByRole('button', { name: 'Pages is at least' }),
    ).toBeInTheDocument();
    expect(requireDefined(chips[1]).querySelector('.ui-filter-bar__chip-value')).toBeNull();
    expect(
      within(requireDefined(chips[0])).getByRole('button', {
        name: 'Remove filter Genre is any of History, Travel',
      }),
    ).toHaveClass('ui-filter-bar__chip-remove');
  });

  it('UIC-FILTER-BAR-2.2 opens a chip’s editor and follows each edit', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.click(screen.getByRole('button', { name: 'Pages is at least' }));
    const dialog = await screen.findByRole('dialog', { name: 'Pages' });
    expect(dialog.closest('.ui-filter-bar__editor')).toHaveClass('ui-popover');
    expect(chipsInDocument()[1]).toHaveAttribute('data-open', 'true');
    await user.type(within(dialog).getByRole('textbox', { name: 'Value' }), '200');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith([genre, { ...pages, value: 200 }]);
    expect(chipsInDocument()[1]).toHaveTextContent('Pages is at least 200');
    expectHooksMatchSpec(document.body, 'FILTER-BAR', {
      slots: [
        'list',
        'chip',
        'chip-button',
        'chip-field',
        'chip-operator',
        'chip-value',
        'chip-remove',
        'editor',
        'operator',
        'value',
        'add',
        'clear',
      ],
    });
  });

  it('UIC-FILTER-BAR-2.2 keeps the editor closed when the host replaces the open condition', async () => {
    const user = userEvent.setup();
    const bar = (value: FilterCondition[]) => <FilterBar fields={fields} value={value} />;
    const { rerender } = render(bar([genre, pages]));
    await user.click(screen.getByRole('button', { name: 'Pages is at least' }));
    await screen.findByRole('dialog', { name: 'Pages' });
    rerender(bar([genre]));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(bar([genre, { ...pages, value: 10 }]));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(chipsInDocument()[1]).not.toHaveAttribute('data-open');
  });

  it('UIC-FILTER-BAR-2.3 adds a filter from the menu and opens its editor', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Title', 'Pages', 'Genre', 'Available']);
    expect(within(menu).queryByRole('searchbox')).not.toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: 'Pages' }));
    expect(onValue).toHaveBeenLastCalledWith([
      genre,
      pages,
      { field: 'pages', operator: 'equals', value: null },
    ]);
    expect(await screen.findByRole('dialog', { name: 'Pages' })).toBeInTheDocument();
    expect(chipsInDocument()[2]).toHaveAttribute('data-open', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('UIC-FILTER-BAR-2.3 searches the add menu from eleven fields', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 11 }, (_, index) => ({
      id: `field-${index}`,
      label: `Field ${index + 1}`,
      type: 'text' as const,
    }));
    const { unmount } = render(<FilterBar fields={many.slice(0, 10)} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    expect(await screen.findByRole('menuitem', { name: 'Field 10' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    unmount();
    render(<FilterBar fields={many} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('UIC-FILTER-BAR-2.4 removes one filter or all, moving focus to the add button', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.click(
      screen.getByRole('button', { name: 'Remove filter Genre is any of History, Travel' }),
    );
    expect(onValue).toHaveBeenLastCalledWith([pages]);
    expect(screen.getByRole('button', { name: 'Add filter' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onValue).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('button', { name: 'Add filter' })).toHaveFocus();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAttribute('data-empty', 'true');
  });

  it('UIC-FILTER-BAR-1.3 keeps an uncontrolled list and reports each change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterBar fields={fields} defaultValue={[genre]} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Available' }));
    expect(onChange).toHaveBeenLastCalledWith([
      genre,
      { field: 'available', operator: 'equals', value: true },
    ]);
    expect(chipsInDocument()).toHaveLength(2);
  });

  it('UIC-FILTER-BAR-2.5 UIC-FILTER-BAR-2.6 leads with the search and carries caller attributes', () => {
    render(
      <FilterBar
        id="book-filters"
        className="custom"
        data-testid="bar"
        aria-label="Book filters"
        fields={fields}
        search={<SearchField label="Search books" />}
      />,
    );
    const bar = screen.getByRole('group', { name: 'Book filters' });
    expect(bar).toHaveAttribute('id', 'book-filters');
    expect(bar).toHaveClass('ui-filter-bar', 'custom');
    expect(bar).toHaveAttribute('data-testid', 'bar');
    expect(bar).toHaveAttribute('data-empty', 'true');
    const search = bar.firstElementChild;
    expect(search).toHaveClass('ui-filter-bar__search');
    expect(
      within(search as HTMLElement).getByRole('searchbox', { name: 'Search books' }),
    ).toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'FILTER-BAR', {
      slots: ['search', 'add'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-FILTER-BAR-4.1 takes its name from labelling elements', () => {
    render(
      <>
        <h2 id="filters-heading">Narrow the list</h2>
        <FilterBar aria-labelledby="filters-heading" fields={fields} />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Narrow the list' })).not.toHaveAttribute(
      'aria-label',
    );
  });
});
