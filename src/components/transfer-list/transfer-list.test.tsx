import { StarGlyph } from '../../core/glyphs.js';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { TransferList, type TransferListItem } from './transfer-list.js';

const cities: TransferListItem[] = [
  { id: 'lisbon', label: 'Lisbon', description: 'Portugal' },
  { id: 'oslo', label: 'Oslo', icon: StarGlyph },
  { id: 'quito', label: 'Quito' },
  { id: 'lima', label: 'Lima' },
  { id: 'malmo', label: 'Malmö' },
];

function side(name: 'Available' | 'Chosen' | string) {
  return screen.getByRole('grid', { name });
}

function rows(name: string) {
  return [...side(name).querySelectorAll('.ui-list-view-item')].map(
    (row) => row.querySelector('.ui-list-row-content__title')?.textContent,
  );
}

function Controlled({ onChange }: { onChange?: (value: Key[]) => void }) {
  const [value, setValue] = useState<Key[]>(['quito']);
  return (
    <TransferList
      aria-label="Cities"
      items={cities}
      value={value}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
      reorderable
    />
  );
}

describe('TransferList', () => {
  it('UIC-TRANSFER-LIST-2.1 UIC-TRANSFER-LIST-2.3 transfers numeric and textual keys independently through its row collections', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TransferList
        aria-label="Keys"
        items={[
          { id: 1, label: 'Numeric item' },
          { id: '1', label: 'Text item' },
        ]}
        defaultValue={[1]}
        onChange={onChange}
      />,
    );
    await user.click(within(side('Available')).getByRole('row', { name: 'Text item' }));
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith([1, '1']);
    expect(rows('Chosen')).toEqual(['Numeric item', 'Text item']);
    await user.click(screen.getByRole('button', { name: 'Move selected to available' }));
    expect(onChange).toHaveBeenLastCalledWith([1]);
    expect(rows('Chosen')).toEqual(['Numeric item']);
    expect(rows('Available')).toEqual(['Text item']);
  });
  it('UIC-TRANSFER-LIST-1.1 UIC-TRANSFER-LIST-2.6 renders two named sides with filters, counts and move buttons', () => {
    const { container } = render(
      <TransferList
        aria-label="Cities"
        items={cities}
        defaultValue={['oslo']}
        className="host"
        data-testid="cities"
        id="cities"
      />,
    );
    const root = screen.getByRole('group', { name: 'Cities' });
    expect(root).toHaveClass('ui-transfer-list', 'host');
    expect(root).toHaveAttribute('data-testid', 'cities');
    expect(root).toHaveAttribute('id', 'cities');
    expect(container.querySelectorAll('.ui-transfer-list__pane')).toHaveLength(2);
    expect(side('Available')).toHaveClass('ui-transfer-list__list');
    expect(screen.getByRole('searchbox', { name: 'Filter available' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filter chosen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move selected to chosen' })).toHaveAttribute(
      'data-scope',
      'selected',
    );
    expect(screen.getByRole('button', { name: 'Move all to chosen' })).toHaveAttribute(
      'data-target',
      'chosen',
    );
    expect(screen.getByRole('button', { name: 'Move all to available' })).toHaveAttribute(
      'data-target',
      'available',
    );
    expect(within(side('Available')).getByRole('row', { name: 'Lisbon' })).toHaveTextContent(
      'Portugal',
    );
    expectHooksMatchSpec(container, 'TRANSFER-LIST', {
      slots: ['pane', 'header', 'title', 'count', 'search', 'list', 'actions', 'move'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-TRANSFER-LIST-1.1 takes titles of its own', () => {
    render(
      <TransferList
        aria-label="Cities"
        items={cities}
        availableLabel="Places"
        chosenLabel="Trip"
      />,
    );
    expect(side('Places')).toBeInTheDocument();
    expect(side('Trip')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move selected to trip' })).toBeInTheDocument();
  });

  it('UIC-TRANSFER-LIST-1.2 lists available items in items order and chosen ones in value order', () => {
    const { rerender } = render(
      <TransferList aria-label="Cities" items={cities} value={['lima', 'lisbon', 'gone']} />,
    );
    expect(rows('Available')).toEqual(['Oslo', 'Quito', 'Malmö']);
    expect(rows('Chosen')).toEqual(['Lima', 'Lisbon']);
    rerender(<TransferList aria-label="Cities" items={cities} value={['quito']} />);
    expect(rows('Chosen')).toEqual(['Quito']);
  });

  it('UIC-TRANSFER-LIST-1.3 UIC-TRANSFER-LIST-2.1 counts each side and its selection', async () => {
    const user = userEvent.setup();
    const { container } = render(<TransferList aria-label="Cities" items={cities} />);
    const count = () => container.querySelector('[data-side="available"] .ui-transfer-list__count');
    expect(count()).toHaveTextContent('5 items');
    await user.click(within(side('Available')).getByRole('row', { name: 'Oslo' }));
    expect(count()).toHaveTextContent('5 items, 1 selected');
    await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');
    expect(count()).toHaveTextContent('5 items, 3 selected');
    await user.keyboard('{Control>}a{/Control}');
    expect(count()).toHaveTextContent('5 items, 5 selected');
  });

  it("UIC-TRANSFER-LIST-1.3 describes each side's list by its count", () => {
    render(<TransferList aria-label="Cities" items={cities} defaultValue={['oslo']} />);
    expect(side('Available')).toHaveAccessibleDescription('4 items');
    expect(side('Chosen')).toHaveAccessibleDescription('1 item');
  });

  it("UIC-TRANSFER-LIST-2.1 redraws no row of one side when the other side's selection changes", async () => {
    const user = userEvent.setup();
    let iconReads = 0;
    const counted = {
      id: 'counted',
      label: 'Counted',
      get icon() {
        iconReads += 1;
        return StarGlyph;
      },
    };
    render(
      <TransferList aria-label="Cities" items={[counted, ...cities]} defaultValue={['lima']} />,
    );
    const before = iconReads;
    await user.click(within(side('Chosen')).getByRole('row', { name: 'Lima' }));
    expect(within(side('Chosen')).getByRole('row', { name: 'Lima' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(iconReads).toBe(before);
  });

  it('UIC-TRANSFER-LIST-1.4 filters each side, ignoring case and accents', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TransferList aria-label="Cities" items={cities} defaultValue={['oslo']} />,
    );
    await user.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'MALMO');
    expect(rows('Available')).toEqual(['Malmö']);
    await user.type(screen.getByRole('searchbox', { name: 'Filter chosen' }), 'paris');
    expect(
      container.querySelector('[data-side="chosen"] .ui-transfer-list__empty'),
    ).toHaveTextContent('No results');
    expect(screen.getByRole('button', { name: 'Move all to available' })).toBeDisabled();
    await user.clear(screen.getByRole('searchbox', { name: 'Filter chosen' }));
    expect(container.querySelector('[data-side="chosen"] .ui-transfer-list__empty')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Move all to available' }));
    expect(rows('Chosen')).toEqual([]);
    expect(
      container.querySelector('[data-side="chosen"] .ui-transfer-list__empty'),
    ).toHaveTextContent('No items');
    expectHooksMatchSpec(container, 'TRANSFER-LIST', { slots: ['empty'] });
  });

  it('UIC-TRANSFER-LIST-2.2 moves the selection or every shown item, which becomes the new selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const forward = screen.getByRole('button', { name: 'Move selected to chosen' });
    expect(forward).toBeDisabled();
    await user.click(within(side('Available')).getByRole('row', { name: 'Lima' }));
    await user.keyboard('{Control>}');
    await user.click(within(side('Available')).getByRole('row', { name: 'Lisbon' }));
    await user.keyboard('{/Control}');
    await user.click(forward);
    expect(onChange).toHaveBeenLastCalledWith(['quito', 'lisbon', 'lima']);
    expect(rows('Chosen')).toEqual(['Quito', 'Lisbon', 'Lima']);
    expect(within(side('Chosen')).getByRole('row', { name: 'Lima' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(side('Chosen')).getByRole('row', { name: 'Quito' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Move selected to available' }));
    expect(rows('Chosen')).toEqual(['Quito']);
    expect(rows('Available')).toEqual(['Lisbon', 'Oslo', 'Lima', 'Malmö']);
    await user.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'l');
    await user.click(screen.getByRole('button', { name: 'Move all to chosen' }));
    expect(onChange).toHaveBeenLastCalledWith(['quito', 'lisbon', 'oslo', 'lima', 'malmo']);
    expect(screen.getByRole('button', { name: 'Move all to chosen' })).toBeDisabled();
  });

  it('UIC-TRANSFER-LIST-1.4 matches every normalized term on either side independently', async () => {
    const user = userEvent.setup();
    render(
      <TransferList
        aria-label="Places"
        items={[
          { id: 'old', label: 'Malmö / Old-town' },
          { id: 'new', label: 'Malmö New town' },
          { id: 'other', label: 'Oslo Old town' },
        ]}
        defaultValue={['new']}
      />,
    );
    await user.type(screen.getByRole('searchbox', { name: 'Filter available' }), 'MALMO_OLD');
    await user.type(screen.getByRole('searchbox', { name: 'Filter chosen' }), 'town-malmo');
    expect(rows('Available')).toEqual(['Malmö / Old-town']);
    expect(rows('Chosen')).toEqual(['Malmö New town']);
  });

  it('UIC-TRANSFER-LIST-2.3 moves a row on double click and with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TransferList aria-label="Cities" items={cities} onChange={onChange} />);
    await user.dblClick(within(side('Available')).getByRole('row', { name: 'Oslo' }));
    expect(onChange).toHaveBeenLastCalledWith(['oslo']);
    await user.click(within(side('Available')).getByRole('row', { name: 'Lisbon' }));
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['oslo', 'lisbon', 'quito']);
    await user.click(within(side('Chosen')).getByRole('row', { name: 'Oslo' }));
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['lisbon', 'quito']);
  });

  it('UIC-TRANSFER-LIST-2.4 reorders the chosen side with move up and move down', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TransferList
        aria-label="Cities"
        items={cities}
        defaultValue={['lisbon', 'oslo', 'quito']}
        reorderable
      />,
    );
    expect(container.querySelector('.ui-transfer-list')).toHaveAttribute(
      'data-reorderable',
      'true',
    );
    const up = screen.getByRole('button', { name: 'Move up' });
    const down = screen.getByRole('button', { name: 'Move down' });
    expect(up).toBeDisabled();
    await user.click(within(side('Chosen')).getByRole('row', { name: 'Quito' }));
    expect(down).toBeDisabled();
    await user.click(up);
    expect(rows('Chosen')).toEqual(['Lisbon', 'Quito', 'Oslo']);
    await user.click(up);
    expect(rows('Chosen')).toEqual(['Quito', 'Lisbon', 'Oslo']);
    expect(up).toBeDisabled();
    await user.click(down);
    expect(rows('Chosen')).toEqual(['Lisbon', 'Quito', 'Oslo']);
    expect(within(side('Chosen')).getAllByRole('button', { name: /drag/i }).length).toBeGreaterThan(
      0,
    );
    expectHooksMatchSpec(container, 'TRANSFER-LIST', { slots: ['reorder'] });
  });

  it('UIC-TRANSFER-LIST-2.5 never selects or moves disabled items, and locks a disabled list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <TransferList
        aria-label="Cities"
        items={cities}
        disabledKeys={['oslo']}
        onChange={onChange}
      />,
    );
    expect(within(side('Available')).getByRole('row', { name: 'Oslo' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.dblClick(within(side('Available')).getByRole('row', { name: 'Oslo' }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Move all to chosen' }));
    expect(onChange).toHaveBeenLastCalledWith(['lisbon', 'quito', 'lima', 'malmo']);
    rerender(
      <TransferList aria-label="Cities" items={cities} isDisabled defaultValue={['lima']} />,
    );
    expect(container.querySelector('.ui-transfer-list')).toHaveAttribute('data-disabled', 'true');
    for (const button of screen.getAllByRole('button', { name: /^Move/ }))
      expect(button).toBeDisabled();
    expect(screen.getByRole('searchbox', { name: 'Filter available' })).toBeDisabled();
    expectHooksMatchSpec(container, 'TRANSFER-LIST');
  });
});
