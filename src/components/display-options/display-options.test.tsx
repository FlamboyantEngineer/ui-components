import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  DisplayOptions,
  type DisplayOptionsProperty,
  type DisplayOptionsValue,
} from './display-options.js';
import {
  createDisplayOptionsValue,
  moveProperties,
  orderProperties,
  toggleProperty,
} from './display-options-model.js';

const properties: DisplayOptionsProperty[] = [
  { id: 'title', label: 'Title', allowsSorting: true },
  { id: 'cuisine', label: 'Cuisine', allowsGrouping: true, allowsSorting: true },
  { id: 'time', label: 'Cooking time', allowsSorting: true },
  { id: 'author', label: 'Author', allowsGrouping: true },
];

const value: DisplayOptionsValue = {
  groupBy: 'cuisine',
  sort: { column: 'time', direction: 'descending' },
  properties: ['time', 'title'],
  density: 'compact',
};

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

async function open(name = 'Display') {
  await userEvent.click(screen.getByRole('button', { name }));
  return screen.getByRole('dialog', { name: 'Display options' });
}

const lastValue = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.lastCall![0] as DisplayOptionsValue;

describe('DisplayOptions model', () => {
  it('UIC-DISPLAY-OPTIONS-1.2 starts with every property, ungrouped and unsorted', () => {
    expect(createDisplayOptionsValue(properties)).toEqual({
      groupBy: null,
      sort: null,
      properties: ['title', 'cuisine', 'time', 'author'],
      density: 'default',
    });
  });

  it('UIC-DISPLAY-OPTIONS-1.5 orders, shows and moves properties', () => {
    expect(orderProperties(properties, ['time', 'gone', 'title']).map(({ id }) => id)).toEqual([
      'time',
      'title',
      'cuisine',
      'author',
    ]);
    const order = ['time', 'title', 'cuisine', 'author'];
    expect(toggleProperty(order, ['time', 'title'], 'author')).toEqual(['time', 'title', 'author']);
    expect(toggleProperty(order, ['time', 'author'], 'title')).toEqual(['time', 'title', 'author']);
    expect(toggleProperty(order, ['time', 'title'], 'time')).toEqual(['title']);
    const shown = ['time', 'title'];
    expect(
      moveProperties(order, shown, { keys: ['time'], targetKey: 'title', position: 'after' }),
    ).toEqual(['title', 'time']);
    expect(
      moveProperties(order, shown, { keys: ['cuisine'], targetKey: 'time', position: 'before' }),
    ).toEqual(['time', 'title']);
    expect(
      moveProperties(order, shown, { keys: ['time'], targetKey: 'gone', position: 'after' }),
    ).toEqual(['time', 'title']);
  });
});

describe('DisplayOptions', { timeout: 20_000 }, () => {
  it('UIC-DISPLAY-OPTIONS-1.1 UIC-DISPLAY-OPTIONS-1.8 opens a popover of the options', async () => {
    const { container } = render(
      <DisplayOptions
        properties={properties}
        densities={['compact', 'default', 'comfortable']}
        className="extra"
        id="display"
        data-lab="display"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-display-options', 'extra');
    expect(root).toHaveAttribute('id', 'display');
    expect(root).toHaveAttribute('data-lab', 'display');
    const button = screen.getByRole('button', { name: 'Display' });
    expect(button).toHaveClass('ui-display-options__trigger', 'ui-button');
    expect(button.querySelector('[data-glyph="adjustments"]')).not.toBeNull();
    expectHooksMatchSpec(container, 'DISPLAY-OPTIONS', {
      slots: ['trigger'],
      callerAttributes: ['data-lab'],
    });
    const dialog = await open();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(dialog.closest('.ui-display-options__popover')).toHaveClass('ui-popover');
    const sections = [...dialog.querySelectorAll('[class*="ui-display-options__"]')]
      .map((element) => element.className.match(/ui-display-options__([a-z-]+)/)?.[1])
      .filter((slot) => ['group-by', 'sort', 'properties', 'density'].includes(slot ?? ''));
    expect(sections).toEqual(['group-by', 'sort', 'properties', 'density']);
    expectHooksMatchSpec(document.body, 'DISPLAY-OPTIONS', {
      slots: 'all',
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-DISPLAY-OPTIONS-1.2 UIC-DISPLAY-OPTIONS-1.3 groups by a property', async () => {
    const onChange = vi.fn();
    render(<DisplayOptions properties={properties} onChange={onChange} />);
    const dialog = await open();
    const groupBy = within(dialog).getByRole('button', { name: /Group by/ });
    expect(groupBy).toHaveTextContent('No grouping');
    await userEvent.click(groupBy);
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['No grouping', 'Cuisine', 'Author']);
    await userEvent.click(screen.getByRole('option', { name: 'Author' }));
    expect(lastValue(onChange)).toEqual({
      groupBy: 'author',
      sort: null,
      properties: ['title', 'cuisine', 'time', 'author'],
      density: 'default',
    });
    expect(groupBy).toHaveTextContent('Author');
  });

  it('UIC-DISPLAY-OPTIONS-1.4 sorts by a property and direction', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<DisplayOptions properties={properties} onChange={onChange} />);
    let dialog = await open();
    const direction = within(dialog).getByRole('radiogroup', { name: 'Sort direction' });
    expect(within(direction).getByRole('radio', { name: 'Ascending' })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: /Sort by/ }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Default order',
      'Title',
      'Cuisine',
      'Cooking time',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Cooking time' }));
    expect(lastValue(onChange).sort).toEqual({ column: 'time', direction: 'ascending' });
    await userEvent.click(within(direction).getByRole('radio', { name: 'Descending' }));
    expect(lastValue(onChange).sort).toEqual({ column: 'time', direction: 'descending' });
    await userEvent.keyboard('{Escape}');
    rerender(<DisplayOptions properties={properties} value={value} onChange={onChange} />);
    dialog = await open();
    await userEvent.click(within(dialog).getByRole('button', { name: /Sort by/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Title' }));
    expect(lastValue(onChange).sort).toEqual({ column: 'title', direction: 'descending' });
    await userEvent.click(within(dialog).getByRole('button', { name: /Sort by/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Default order' }));
    expect(lastValue(onChange).sort).toBeNull();
  });

  it('UIC-DISPLAY-OPTIONS-1.5 shows and hides properties in order', async () => {
    const onChange = vi.fn();
    render(<DisplayOptions properties={properties} value={value} onChange={onChange} />);
    const dialog = await open();
    const list = within(dialog).getByRole('grid', { name: 'Shown properties' });
    const rows = within(list).getAllByRole('row');
    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Cooking time',
      'Title',
      'Cuisine',
      'Author',
    ]);
    expect(rows[0]).toHaveClass('ui-display-options__property');
    expect(rows.map((row) => row.getAttribute('data-shown'))).toEqual(['true', 'true', null, null]);
    expect(rows[0]!.querySelector('.ui-list-view-item__drag-handle')).not.toBeNull();
    const author = within(rows[3]!).getByRole('checkbox', { name: 'Show Author' });
    expect(author.closest('.ui-display-options__visibility')).toHaveClass('ui-checkbox');
    expect(author).not.toBeChecked();
    expect(within(rows[0]!).getByRole('checkbox', { name: 'Show Cooking time' })).toBeChecked();
    await userEvent.click(author);
    expect(lastValue(onChange).properties).toEqual(['time', 'title', 'author']);
    await userEvent.click(rows[0]!);
    expect(lastValue(onChange).properties).toEqual(['title']);
  });

  it('UIC-DISPLAY-OPTIONS-1.6 offers the densities given', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DisplayOptions
        properties={properties}
        value={value}
        onChange={onChange}
        densities={['compact', 'comfortable']}
      />,
    );
    let dialog = await open();
    const density = within(dialog).getByRole('radiogroup', { name: 'Density' });
    expect(
      within(density)
        .getAllByRole('radio')
        .map((radio) => radio.textContent),
    ).toEqual(['Compact', 'Comfortable']);
    expect(within(density).getByRole('radio', { name: 'Compact' })).toBeChecked();
    await userEvent.click(within(density).getByRole('radio', { name: 'Comfortable' }));
    expect(lastValue(onChange).density).toBe('comfortable');
    await userEvent.keyboard('{Escape}');
    rerender(<DisplayOptions properties={properties} value={value} onChange={onChange} />);
    dialog = await open();
    expect(within(dialog).queryByRole('radiogroup', { name: 'Density' })).toBeNull();
  });

  it('UIC-DISPLAY-OPTIONS-1.7 disables the button', () => {
    const { container } = render(
      <DisplayOptions properties={properties} label="View" isDisabled />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'View' })).toBeDisabled();
  });

  it('UIC-DISPLAY-OPTIONS-2.1 takes focus in the popover and returns it on Escape', async () => {
    render(<DisplayOptions properties={properties.slice(0, 1)} />);
    const button = screen.getByRole('button', { name: 'Display' });
    const dialog = await open();
    expect(within(dialog).queryByRole('button', { name: /Group by/ })).toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveFocus());
  });
});
