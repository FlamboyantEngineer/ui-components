import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table, type TableProps } from './table.js';
import type { TableColumn } from './table-rows.js';

interface City {
  id: string;
  name: string;
  country: string;
  people: number;
}

const cities: City[] = [
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal', people: 545 },
  { id: 'oslo', name: 'Oslo', country: 'Norway', people: 709 },
];
const columns: TableColumn<City>[] = [
  { id: 'name', header: 'Name' },
  { id: 'country', header: 'Country', allowsHiding: true },
  { id: 'people', header: 'People', allowsHiding: true },
];

const headers = () =>
  screen.getAllByRole('columnheader', { hidden: true }).map((header) => header.textContent);

function renderCities(props: Partial<TableProps<City>> = {}, storage = createMemoryStorage()) {
  return render(
    <UiProvider storage={storage}>
      <Table aria-label="Cities" rows={cities} columns={columns} {...props} />
    </UiProvider>,
  );
}

// Full React Aria tables and menus driven by userEvent are slow in jsdom on a busy machine.
describe('Table column layout', { timeout: 15_000 }, () => {
  it('UIC-TABLE-8.1 hides and shows hideable columns from the columns menu', async () => {
    const user = userEvent.setup();
    const onColumnLayoutChange = vi.fn();
    const { container } = renderCities({ onColumnLayoutChange });
    const toolbar = container.querySelector('.ui-table__toolbar') as HTMLElement;
    const trigger = within(toolbar).getByRole('button', { name: 'Columns' });
    expect(trigger).toHaveClass('ui-table__columns-menu');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['toolbar', 'columns-menu'] });
    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitemcheckbox');
    expect(items.map((item) => item.textContent)).toEqual(['Country', 'People']);
    expect(items[0]).toBeChecked();
    await user.click(requireDefined(items[0]));
    expect(headers()).toEqual(['Name', 'People']);
    expect(onColumnLayoutChange).toHaveBeenLastCalledWith({ hidden: ['country'] });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(
      requireDefined(within(await screen.findByRole('menu')).getAllByRole('menuitemcheckbox')[0]),
    );
    expect(headers()).toEqual(['Name', 'Country', 'People']);
  });

  it('UIC-TABLE-8.1 draws no toolbar without a hideable column or a search box', () => {
    const { container } = renderCities({ columns: [{ id: 'name', header: 'Name' }] });
    expect(container.querySelector('.ui-table__toolbar')).toBeNull();
  });

  it('UIC-TABLE-8.2 follows a controlled layout and starts from a default one', () => {
    const { rerender } = renderCities({
      columnLayout: { order: ['people', 'name'], hidden: ['country'] },
    });
    expect(headers()).toEqual(['People', 'Name']);
    rerender(
      <UiProvider>
        <Table
          aria-label="Cities"
          rows={cities}
          columns={columns}
          columnLayout={{ order: ['country'] }}
        />
      </UiProvider>,
    );
    expect(headers()).toEqual(['Country', 'Name', 'People']);
    renderCities({ defaultColumnLayout: { hidden: ['people', 'name'] } });
    expect(
      requireDefined(screen.getAllByRole('grid')[1]).querySelectorAll('[role="columnheader"]'),
    ).toHaveLength(1);
  });

  it('UIC-TABLE-8.3 persists the layout under its key and restores it on mount', async () => {
    const user = userEvent.setup();
    const storage: UiStorage = createMemoryStorage();
    const view = renderCities({ persistKey: 'cities' }, storage);
    await user.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'People' }));
    expect(JSON.parse(storage.getItem('cities:layout') ?? '{}')).toEqual({ hidden: ['people'] });
    view.unmount();
    renderCities({ persistKey: 'cities' }, storage);
    expect(headers()).toEqual(['Name', 'Country']);
  });

  it('UIC-TABLE-8.3 ignores unknown columns and unusable stored layouts', () => {
    const storage = createMemoryStorage();
    storage.setItem('cities:layout', JSON.stringify({ order: ['gone', 'people'], hidden: 3 }));
    const view = renderCities({ persistKey: 'cities' }, storage);
    expect(headers()).toEqual(['People', 'Name', 'Country']);
    view.unmount();
    storage.setItem('cities:layout', '{broken');
    renderCities({ persistKey: 'cities' }, storage);
    expect(headers()).toEqual(['Name', 'Country', 'People']);
  });
});
