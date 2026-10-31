import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { SelectField } from './select-field.js';

interface Place {
  id: string;
  name: string;
  children?: Place[];
  hasChildren?: boolean;
}

const places: Place[] = [
  {
    id: 'europe',
    name: 'Europe',
    children: [
      {
        id: 'norway',
        name: 'Norway',
        children: [
          { id: 'oslo', name: 'Oslo' },
          { id: 'bergen', name: 'Bergen' },
        ],
      },
      { id: 'portugal', name: 'Portugal', children: [{ id: 'lisbon', name: 'Lisbon' }] },
    ],
  },
  { id: 'americas', name: 'Americas', children: [{ id: 'peru', name: 'Peru' }] },
];

const getTextValue = (place: Place) => place.name;

/** Reports every observed loading sentinel as in view at once: jsdom has no layout. */
class VisibleObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  disconnect() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function trigger(name: RegExp | string) {
  return screen.getByRole('button', { name });
}

function tree() {
  return screen.getByRole('treegrid', { name: 'Place' });
}

function row(name: string) {
  return within(tree()).getByRole('row', { name });
}

describe('SelectTreeField', () => {
  it('UIC-SELECT-FIELD-10.6 preserves hidden inputs for numeric and text keys when reordered', () => {
    const items = [
      { id: 1, name: 'Numeric' },
      { id: '1', name: 'Textual' },
    ];
    const props = {
      label: 'Kind',
      items,
      getTextValue: (item: (typeof items)[number]) => item.name,
      name: 'kinds',
      selectionMode: 'multiple' as const,
      selectionPropagation: false,
    };
    const { container, rerender } = render(<SelectField mode="tree" {...props} value={[1, '1']} />);
    const [numeric, textual] = container.querySelectorAll('input[type="hidden"][name="kinds"]');
    rerender(<SelectField mode="tree" {...props} value={['1', 1]} />);
    expect([...container.querySelectorAll('input[type="hidden"][name="kinds"]')]).toEqual([
      textual,
      numeric,
    ]);
  });

  it('UIC-SELECT-FIELD-10.3 names the chips from the field label when no label is drawn', () => {
    render(
      <SelectField
        mode="tree"
        label="Place"
        labelLayout="control-only"
        selectionMode="multiple"
        items={places}
        getTextValue={getTextValue}
        defaultValue={['oslo']}
      />,
    );
    expect(screen.getByRole('grid', { name: 'Place selected values' })).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-9.1 UIC-SELECT-FIELD-10.7 renders a field around a framed trigger', () => {
    const { container } = render(
      <SelectField
        mode="tree"
        id="place"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        className="host"
        data-testid="place"
      />,
    );
    const root = container.querySelector('.ui-select-field');
    expect(root).toHaveClass('ui-field', 'host');
    expect(root).toHaveAttribute('data-selection-mode', 'single');
    expect(root).toHaveAttribute('data-value-display', 'label');
    expect(root).toHaveAttribute('data-testid', 'place');
    const button = trigger('Place Select an option');
    expect(button).toHaveClass('ui-select-field__trigger');
    expect(button.parentElement).toHaveClass('ui-select-field__frame');
    expect(container.querySelector('.ui-select-field__value')).toHaveAttribute(
      'data-placeholder',
      'true',
    );
    expectHooksMatchSpec(container, 'SELECT-FIELD', {
      slots: ['frame', 'trigger', 'value', 'chevron'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-SELECT-FIELD-9.2 opens a named dialog with a focused search and a tree open at the value', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        defaultValue="bergen"
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(trigger('Place Bergen'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    const dialog = screen.getByRole('dialog', { name: 'Place' });
    expect(dialog).toHaveClass('ui-select-field__dialog');
    expect(within(dialog).getByRole('searchbox', { name: 'Filter place' })).toHaveFocus();
    expect(tree()).toHaveClass('ui-tree', 'ui-select-field__tree');
    expect(tree()).toHaveAttribute('data-variant', 'picker');
    expect(row('Bergen')).toHaveAttribute('aria-selected', 'true');
    expect(row('Norway')).toHaveAttribute('aria-expanded', 'true');
    expect(within(tree()).queryByRole('row', { name: 'Lisbon' })).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', {
      slots: ['popover', 'dialog', 'search', 'tree'],
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger('Place Bergen')).toHaveFocus());
  });

  it('UIC-SELECT-FIELD-9.2 starts every opening with an empty search, open at the value', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<Key | null>('peru');
      return (
        <SelectField
          mode="tree"
          label="Place"
          items={places}
          getTextValue={getTextValue}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Controlled />);
    await user.click(trigger('Place Peru'));
    await user.keyboard('ber');
    await user.click(row('Bergen'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(trigger('Place Bergen'));
    expect(screen.getByRole('searchbox', { name: 'Filter place' })).toHaveValue('');
    expect(row('Norway')).toHaveAttribute('aria-expanded', 'true');
    expect(row('Bergen')).toHaveAttribute('aria-selected', 'true');
    expect(row('Americas')).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-SELECT-FIELD-9.2 follows a controlled open state', () => {
    const { rerender } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        isOpen={false}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <SelectField mode="tree" label="Place" items={places} getTextValue={getTextValue} isOpen />,
    );
    expect(screen.getByRole('dialog', { name: 'Place' })).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-9.3 chooses a row by press or keyboard, commits and closes', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<Key | null>(null);
      return (
        <SelectField
          mode="tree"
          label="Place"
          items={places}
          getTextValue={getTextValue}
          value={value}
          onChange={setValue}
          onCommit={onCommit}
          defaultOpen
        />
      );
    }
    render(<Controlled />);
    await user.click(row('Americas'));
    expect(onCommit).toHaveBeenLastCalledWith('americas');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(trigger('Place Americas'));
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('americas');
    await user.click(trigger('Place Americas'));
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('norway');
    await waitFor(() => expect(trigger('Place Norway')).toHaveFocus());
  });

  it('UIC-SELECT-FIELD-9.4 reads a chosen node as its path', () => {
    const { container } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        defaultValue="oslo"
        valueDisplay="path"
      />,
    );
    expect(container.querySelector('.ui-select-field')).toHaveAttribute(
      'data-value-display',
      'path',
    );
    expect(container.querySelector('.ui-select-field__value')).toHaveTextContent(
      'Europe/Norway/Oslo',
    );
  });

  it('UIC-SELECT-FIELD-9.5 reads an unloaded key as itself', () => {
    const { container } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        defaultValue="quito"
      />,
    );
    const value = container.querySelector('.ui-select-field__value');
    expect(value).toHaveTextContent('quito');
    expect(value).toHaveAttribute('data-missing', 'true');
    expectHooksMatchSpec(container, 'SELECT-FIELD');
  });

  it('UIC-SELECT-FIELD-10.1 filters with ancestors and moves down to the first row', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        defaultOpen
      />,
    );
    await user.keyboard('lis');
    expect(
      within(tree())
        .getAllByRole('row')
        .map((node) => node.getAttribute('aria-label') ?? node.textContent),
    ).toEqual(['Europe', 'Portugal', 'Lisbon']);
    await user.keyboard('{ArrowDown}');
    expect(row('Europe')).toHaveFocus();
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('zzz');
    expect(within(tree()).getByText('No results')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-10.1 leaves a composing Down in the search to the input method', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        defaultOpen
      />,
    );
    const search = screen.getByRole('searchbox');
    act(() => search.focus());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(search, { key: 'ArrowDown', isComposing: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set keyCode on a keydown
    fireEvent.keyDown(search, { key: 'ArrowDown', keyCode: 229 });
    expect(search).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(row('Europe')).toHaveFocus();
  });

  it('UIC-SELECT-FIELD-10.2 UIC-SELECT-FIELD-10.3 chooses several with cascading checkboxes and chips', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        selectionMode="multiple"
        defaultValue={['peru']}
        onChange={onChange}
      />,
    );
    expect(container.querySelector('.ui-select-field')).toHaveAttribute(
      'data-selection-mode',
      'multiple',
    );
    await user.click(trigger('Place 1 selected'));
    expect(row('Peru')).toHaveAttribute('aria-selected', 'true');
    expect(row('Americas')).toHaveAttribute('aria-selected', 'false');
    await user.click(within(row('Europe')).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith([
      'europe',
      'norway',
      'oslo',
      'bergen',
      'portugal',
      'lisbon',
      'americas',
      'peru',
    ]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    const chips = screen.getByRole('grid', { name: 'Place selected values' });
    expect(chips.closest('.ui-select-field__chips')).not.toBeNull();
    expect(
      within(chips)
        .getAllByRole('row')
        .map((chip) => chip.textContent),
    ).toEqual(['Europe', 'Americas']);
    expect(trigger('Place 2 selected')).toBeInTheDocument();
    await user.click(within(chips).getByRole('button', { name: 'Remove Europe' }));
    expect(onChange).toHaveBeenLastCalledWith(['americas', 'peru']);
    expectHooksMatchSpec(container, 'SELECT-FIELD', { slots: ['chips', 'chip'] });
  });

  it('UIC-SELECT-FIELD-10.2 UIC-SELECT-FIELD-10.3 chooses rows on their own without propagation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        selectionMode="multiple"
        selectionPropagation={false}
        defaultValue={['europe', 'oslo']}
        onChange={onChange}
      />,
    );
    const chips = screen.getByRole('grid', { name: 'Place selected values' });
    expect(
      within(chips)
        .getAllByRole('row')
        .map((chip) => chip.textContent),
    ).toEqual(['Europe', 'Oslo']);
    within(chips).getByRole('row', { name: 'Europe' }).focus();
    await user.keyboard('{Delete}');
    expect(onChange).toHaveBeenLastCalledWith(['oslo']);
    await user.click(trigger('Place 1 selected'));
    await user.click(within(row('Americas')).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(['oslo', 'americas']);
  });

  it('UIC-SELECT-FIELD-10.4 loads a branch lazily and reindexes the grown items', async () => {
    vi.stubGlobal('IntersectionObserver', VisibleObserver);
    const user = userEvent.setup();
    function Lazy() {
      const [items, setItems] = useState<Place[]>([
        { id: 'asia', name: 'Asia', hasChildren: true },
      ]);
      return (
        <SelectField
          mode="tree"
          label="Place"
          items={items}
          getTextValue={getTextValue}
          hasChildItems={(place) => Boolean(place.hasChildren)}
          onLoadChildren={() => {
            setItems([{ id: 'asia', name: 'Asia', children: [{ id: 'nepal', name: 'Nepal' }] }]);
          }}
          defaultValue="nepal"
        />
      );
    }
    const { container } = render(<Lazy />);
    expect(container.querySelector('.ui-select-field__value')).toHaveTextContent('nepal');
    await user.click(trigger('Place nepal'));
    await user.click(within(row('Asia')).getByRole('button'));
    await waitFor(() => expect(row('Nepal')).toBeInTheDocument());
    expect(container.querySelector('.ui-select-field__value')).toHaveTextContent('Nepal');
  });

  it('UIC-SELECT-FIELD-10.5 clears, stays shut while read-only and disables the trigger', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, unmount } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        defaultValue="peru"
        isClearable
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear Place' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(trigger('Place Select an option')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear Place' })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'SELECT-FIELD');
    unmount();
    const { unmount: unmountReadOnly } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        selectionMode="multiple"
        defaultValue={['peru']}
        isReadOnly
      />,
    );
    await user.click(trigger(/^Place /));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Peru' })).not.toBeInTheDocument();
    unmountReadOnly();
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        isDisabled
      />,
    );
    expect(trigger(/^Place /)).toBeDisabled();
  });

  it('UIC-SELECT-FIELD-10.5 reports no opening while read-only', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        isReadOnly
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(trigger(/^Place /));
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('UIC-SELECT-FIELD-10.6 submits hidden inputs under its name', () => {
    const { container, unmount } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        name="place"
      />,
    );
    const values = () =>
      [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="place"]')].map(
        (input) => input.value,
      );
    expect(values()).toEqual(['']);
    unmount();
    const { container: multiple } = render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={getTextValue}
        name="places"
        selectionMode="multiple"
        defaultValue={['oslo', 'peru']}
      />,
    );
    expect(
      [...multiple.querySelectorAll<HTMLInputElement>('input[name="places"]')].map(
        (input) => input.value,
      ),
    ).toEqual(['oslo', 'peru']);
  });
  it('UIC-SELECT-FIELD-9.4 reads only the chosen node when showing a label', () => {
    const read = vi.fn(getTextValue);
    render(
      <SelectField
        mode="tree"
        label="Place"
        items={places}
        getTextValue={read}
        value="oslo"
        valueDisplay="label"
      />,
    );
    expect(screen.getByText('Oslo')).toBeInTheDocument();
    expect(read).toHaveBeenCalled();
    expect(read.mock.calls.every(([place]) => place.id === 'oslo')).toBe(true);
  });
});
