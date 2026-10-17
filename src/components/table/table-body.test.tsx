import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Table, type TableProps } from './table.js';

interface City {
  id: string;
  name: string;
  country: string;
}

const cities: City[] = [
  { id: 'lisbon', name: 'Lisbon', country: 'Portugal' },
  { id: 'oslo', name: 'Oslo', country: 'Norway' },
];

function renderCities(props: Partial<TableProps<City>> = {}) {
  return render(
    <Table
      aria-label="Cities"
      rows={cities}
      columns={[
        { id: 'name', header: 'Name' },
        { id: 'country', header: 'Country' },
      ]}
      {...props}
    />,
  );
}

const stateRow = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.ui-table__state-row');

// Full React Aria tables driven by userEvent are slow in jsdom on a busy machine.
describe('Table notices', { timeout: 15_000 }, () => {
  it('UIC-TABLE-6.1 UIC-TABLE-6.2 replaces stale rows with a spanning loading notice', () => {
    const { container } = renderCities({
      isLoading: true,
      loadingMessage: 'Fetching cities',
      selectionMode: 'multiple',
      renderRowActions: () => null,
    });
    expect(screen.getByRole('grid', { name: 'Cities' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    expect(screen.queryByText('Lisbon')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Fetching cities');
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(stateRow(container)).toHaveAttribute('data-variant', 'loading');
    expect(container.querySelector('.ui-table__state-cell')).toHaveAttribute('colspan', '4');
    expectHooksMatchSpec(container, 'TABLE', { slots: ['state-row', 'state-cell'] });
  });

  it('UIC-TABLE-6.2 reads the provider loading string by default', () => {
    renderCities({ isLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('UIC-TABLE-6.3 shows the empty notice when there are no rows', () => {
    const { container, rerender } = renderCities({ rows: [] });
    expect(screen.getByRole('row', { name: 'No results' })).toBeInTheDocument();
    expect(stateRow(container)).toHaveAttribute('data-variant', 'empty');
    expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
    rerender(
      <Table
        aria-label="Cities"
        rows={[]}
        columns={[{ id: 'name', header: 'Name' }]}
        emptyMessage="No cities yet"
      />,
    );
    expect(screen.getByText('No cities yet')).toBeInTheDocument();
  });

  it('UIC-TABLE-6.1 UIC-TABLE-6.4 shows an error over loading, with a retry that acts alone', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onRowAction = vi.fn();
    const onSelectionChange = vi.fn();
    const { container } = renderCities({
      isLoading: true,
      errorMessage: 'Cities are unavailable',
      onRetry,
      onRowAction,
      selectionMode: 'single',
      onSelectionChange,
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Cities are unavailable');
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
    expect(stateRow(container)).toHaveAttribute('data-variant', 'error');
    expect(stateRow(container)).not.toHaveAttribute('aria-disabled');
    const retry = screen.getByRole('button', { name: 'Retry' });
    await user.click(retry);
    retry.focus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(2);
    await user.click(screen.getByText('Cities are unavailable'));
    expect(onRowAction).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-6.1 keeps the notice row reachable by keyboard', async () => {
    const user = userEvent.setup();
    const { container } = renderCities({
      errorMessage: 'Cities are unavailable',
      onRetry: () => {},
    });
    await user.tab();
    expect(stateRow(container)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus();
  });

  it('UIC-TABLE-6.1 renders a table without data columns without failing', () => {
    const { container } = renderCities({
      columns: [],
      selectionMode: 'multiple',
      renderRowActions: () => null,
      isLoading: true,
    });
    expect(screen.getByRole('grid', { name: 'Cities' })).toBeInTheDocument();
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(container.querySelector('.ui-table__body')).toBeEmptyDOMElement();
  });
});
