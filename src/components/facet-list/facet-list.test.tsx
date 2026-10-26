import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { FacetList, type FacetListOption } from './facet-list.js';

const cities: FacetListOption[] = [
  { value: 'lisbon', label: 'Lisbon', count: 1280 },
  { value: 'oslo', label: 'Oslo', count: 96 },
  { value: 'lima', label: 'Lima', count: 61 },
  { value: 'hanoi', label: 'Hanoi', count: 52 },
  { value: 'cork', label: 'Cork', count: 12 },
  { value: 'perth', label: 'Perth' },
  { value: 'nuuk', label: 'Nuuk', count: 0, isDisabled: true },
];

const names = () =>
  screen
    .getAllByRole('checkbox')
    .map((box) => box.getAttribute('aria-label') ?? box.closest('label')?.textContent);

describe('FacetList', () => {
  it('UIC-FACET-LIST-1.1 UIC-FACET-LIST-2.1 names a group of values with their counts', () => {
    render(<FacetList label="City" options={cities.slice(0, 3)} />);
    const group = screen.getByRole('group', { name: 'City' });
    expect(group).toHaveClass('ui-facet-list__options');
    expect(within(group).getByRole('checkbox', { name: 'Lisbon, 1,280' })).not.toBeChecked();
    const option = screen.getByRole('checkbox', { name: 'Oslo, 96' }).closest('label');
    expect(option).toHaveClass('ui-checkbox', 'ui-facet-list__option');
    expect(option?.querySelector('.ui-facet-list__count')).toHaveTextContent('96');
    expect(screen.getByText('City')).toHaveClass('ui-facet-list__label');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'FACET-LIST', {
      slots: ['label', 'options', 'option', 'option-label', 'count'],
    });
  });

  it('UIC-FACET-LIST-1.1 shows no count for a value without one and formats counts for the locale', () => {
    render(
      <UiProvider locale="de-DE">
        <FacetList label="City" options={[cities[0]!, cities[5]!]} />
      </UiProvider>,
    );
    expect(screen.getByRole('checkbox', { name: 'Lisbon, 1.280' })).toBeInTheDocument();
    const perth = screen.getByRole('checkbox', { name: 'Perth' });
    expect(perth.closest('label')?.querySelector('.ui-facet-list__count')).toBeNull();
  });

  it('UIC-FACET-LIST-1.2 reports ticked values in option order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FacetList
        label="City"
        options={cities}
        limit={10}
        defaultValue={['lima']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Oslo, 96' }));
    expect(onChange).toHaveBeenLastCalledWith(['oslo', 'lima']);
    await user.click(screen.getByRole('checkbox', { name: 'Lima, 61' }));
    expect(onChange).toHaveBeenLastCalledWith(['oslo']);
    expect(screen.getByRole('checkbox', { name: 'Nuuk, 0' })).toBeDisabled();
  });

  it('UIC-FACET-LIST-1.4 folds values past the limit behind a toggle', async () => {
    const user = userEvent.setup();
    render(<FacetList label="City" options={cities} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    const toggle = screen.getByRole('button', { name: 'Show 2 more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', screen.getByRole('group').id);
    await user.click(toggle);
    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
    expect(toggle).toHaveTextContent('Show less');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.closest('.ui-facet-list')).toHaveAttribute('data-expanded', 'true');
    expectHooksMatchSpec(document.body, 'FACET-LIST', { slots: ['toggle'] });
  });

  it('UIC-FACET-LIST-1.3 searches the values, keeping hidden ticks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const many = [
      ...cities,
      ...['Quebec', 'Tbilisi', 'Ushuaia', 'Tromsø'].map((label) => ({ value: label, label })),
    ];
    render(<FacetList label="City" options={many} defaultValue={['oslo']} onChange={onChange} />);
    const search = screen.getByRole('searchbox', { name: 'Filter city' });
    expect(search.closest('.ui-search-field')).toHaveClass('ui-facet-list__search');
    await user.type(search, 'LI');
    expect(names()).toEqual(['Lisbon, 1,280', 'Lima, 61', 'Tbilisi']);
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Lima, 61' }));
    expect(onChange).toHaveBeenLastCalledWith(['oslo', 'lima']);
    await user.clear(search);
    await user.type(search, 'zz');
    expect(screen.getByText('No results')).toHaveClass('ui-facet-list__empty');
    expectHooksMatchSpec(document.body, 'FACET-LIST', { slots: ['search', 'empty'] });
  });

  it('UIC-FACET-LIST-1.1 exposes the label as a heading at the section level', () => {
    render(<FacetList label="City" options={cities.slice(0, 3)} />);
    const heading = screen.getByRole('heading', { name: 'City', level: 3 });
    expect(heading).toHaveClass('ui-facet-list__label');
  });

  it('UIC-FACET-LIST-1.2 keeps ticked values that no option shows when another is ticked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FacetList
        label="City"
        options={[cities[1]!, { value: 'bergen', label: 'Bergen' }]}
        value={['oslo', 'lima']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Bergen' }));
    expect(onChange).toHaveBeenLastCalledWith(['oslo', 'bergen', 'lima']);
  });

  it('UIC-FACET-LIST-1.3 UIC-FACET-LIST-1.4 drops the query when the search field goes', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, index) => ({
      value: `city-${index}`,
      label: index === 3 ? 'Oslo' : `City ${index}`,
    }));
    const { rerender } = render(<FacetList label="City" options={many} />);
    await user.type(screen.getByRole('searchbox', { name: 'Filter city' }), 'os');
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    rerender(<FacetList label="City" options={many.slice(0, 9)} />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Show 4 more' })).toBeInTheDocument();
  });

  it('UIC-FACET-LIST-1.5 lists ticked values first, holding the order while focus is inside', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string[]>(['cork']);
      return (
        <>
          <FacetList
            label="City"
            options={cities}
            limit={10}
            value={value}
            onChange={setValue}
            selectedFirst
          />
          <button type="button">Elsewhere</button>
        </>
      );
    }
    render(<Controlled />);
    expect(names()[0]).toBe('Cork, 12');
    await user.click(screen.getByRole('checkbox', { name: 'Hanoi, 52' }));
    expect(names().slice(0, 2)).toEqual(['Cork, 12', 'Lisbon, 1,280']);
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(names().slice(0, 3)).toEqual(['Hanoi, 52', 'Cork, 12', 'Lisbon, 1,280']);
  });

  it('UIC-FACET-LIST-1.6 carries caller attributes', () => {
    const { container } = render(
      <FacetList
        id="city"
        className="custom"
        data-testid="facet"
        label="City"
        options={cities.slice(0, 2)}
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('id', 'city');
    expect(root).toHaveClass('ui-facet-list', 'custom');
    expect(root).toHaveAttribute('data-testid', 'facet');
    act(() => screen.getAllByRole('checkbox')[0]!.focus());
    expectHooksMatchSpec(container, 'FACET-LIST', { callerAttributes: ['data-testid'] });
  });
});
