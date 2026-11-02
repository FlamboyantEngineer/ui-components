import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CardGrid, CardGridItem } from '../components/card/card-grid.js';
import { Combobox } from '../components/combobox/combobox.js';
import { ListView, ListViewItem } from '../components/list-row/list-view.js';
import { NumberField } from '../components/number-field/number-field.js';
import { Table } from '../components/table/table.js';
import { TextField } from '../components/text-field/text-field.js';
import { Tree } from '../components/tree/tree.js';
import { isTextControlKey, keepTextControlKeys } from './text-control-keys.js';

interface Fruit {
  id: string;
  name: string;
}

const fruit: readonly Fruit[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'banana', name: 'Banana' },
  { id: 'cherry', name: 'Cherry' },
];

/** A note field in the first item only, holding `ab`. */
function noteFor(item: Fruit): ReactNode {
  return item.id === 'apple' ? (
    <TextField label={`Note for ${item.name}`} defaultValue="ab" />
  ) : null;
}

const surfaces: Record<string, () => ReactNode> = {
  ListView: () => (
    <ListView aria-label="Fruit" items={fruit}>
      {(item) => <ListViewItem id={item.id} title={item.name} trailing={noteFor(item)} />}
    </ListView>
  ),
  CardGrid: () => (
    <CardGrid aria-label="Fruit" items={fruit}>
      {(item) => (
        <CardGridItem id={item.id} textValue={item.name}>
          {item.name}
          {noteFor(item)}
        </CardGridItem>
      )}
    </CardGrid>
  ),
  Tree: () => (
    <Tree<Fruit>
      aria-label="Fruit"
      items={fruit}
      getTextValue={(item) => item.name}
      renderActions={(item) => noteFor(item)}
    />
  ),
  Table: () => (
    <Table
      aria-label="Fruit"
      rows={fruit}
      columns={[
        { id: 'name', header: 'Name', isRowHeader: true, renderCell: (row: Fruit) => row.name },
        { id: 'note', header: 'Note', renderCell: noteFor },
      ]}
    />
  ),
};

describe('text controls inside collections', () => {
  it.each(Object.keys(surfaces))(
    'UIC-LIST-ROW-3.1 UIC-LIST-ROW-3.2 UIC-CARD-5.1 UIC-TREE-3.6 UIC-TABLE-3.4 leaves the caret keys and characters to a text field in a %s item',
    async (name) => {
      const user = userEvent.setup();
      render(<>{surfaces[name]?.()}</>);
      const field = screen.getByRole<HTMLInputElement>('textbox', { name: 'Note for Apple' });
      await user.click(field);
      await user.keyboard('{End}{ArrowLeft}');
      expect(field).toHaveFocus();
      expect(field.selectionStart).toBe(1);
      await user.keyboard('{Home}b');
      expect(field).toHaveFocus();
      expect(field).toHaveValue('bab');
      await user.keyboard('{ArrowRight}{ArrowDown}{ArrowUp}{End}c');
      expect(field).toHaveFocus();
      expect(field).toHaveValue('babc');
    },
  );

  it('UIC-LIST-ROW-3.1 lets a NumberField step and a Combobox open in a row', async () => {
    const user = userEvent.setup();
    render(
      <ListView aria-label="Settings">
        <ListViewItem
          id="count"
          title="Count"
          trailing={<NumberField label="Servings" defaultValue={2} />}
        />
        <ListViewItem
          id="kind"
          title="Kind"
          trailing={
            <Combobox
              label="Fruit kind"
              defaultItems={[...fruit].map(({ id, name }) => ({ id, label: name }))}
            />
          }
        />
        <ListViewItem id="other" title="Other" />
      </ListView>,
    );
    const servings = screen.getByRole('textbox', { name: 'Servings' });
    await user.click(servings);
    await user.keyboard('{ArrowUp}');
    expect(servings).toHaveFocus();
    expect(servings).toHaveValue('3');
    const kind = screen.getByRole('combobox', { name: 'Fruit kind' });
    await user.click(kind);
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(kind).toHaveFocus();
  });

  it('UIC-LIST-ROW-3.1 passes Tab and Escape, and keys of toggles, to the collection', () => {
    const input = document.createElement('input');
    const box = document.createElement('input');
    box.type = 'checkbox';
    expect(isTextControlKey({ key: 'ArrowDown', target: input })).toBe(true);
    expect(isTextControlKey({ key: 'Tab', target: input })).toBe(false);
    expect(isTextControlKey({ key: 'Escape', target: input })).toBe(false);
    expect(isTextControlKey({ key: 'ArrowDown', target: box })).toBe(false);
    expect(isTextControlKey({ key: 'ArrowDown', target: null })).toBe(false);
  });

  it.each(['button', 'div'])(
    'UIC-TABLE-3.4 reserves picker keys for a %s listbox trigger and its children',
    (tag) => {
      const trigger = document.createElement(tag);
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-haspopup', 'listbox');
      const label = document.createElement('span');
      trigger.append(label);
      expect(isTextControlKey({ key: 'ArrowDown', target: label })).toBe(true);
      expect(isTextControlKey({ key: 'Tab', target: label })).toBe(false);
      expect(isTextControlKey({ key: 'Escape', target: label })).toBe(false);
      trigger.setAttribute('aria-haspopup', 'menu');
      expect(isTextControlKey({ key: 'ArrowDown', target: label })).toBe(false);
      trigger.removeAttribute('aria-haspopup');
      expect(isTextControlKey({ key: 'ArrowDown', target: label })).toBe(false);
    },
  );

  it.each(['Control', 'Meta'])(
    'UIC-TABLE-3.4 forwards %s+Enter from a picker to enclosing shortcuts',
    async (modifier) => {
      const user = userEvent.setup();
      const collection = vi.fn();
      const enclosing = vi.fn();
      render(
        <div onKeyDown={enclosing}>
          <div {...keepTextControlKeys({ onKeyDown: collection, onKeyDownCapture: collection })}>
            <button aria-haspopup="listbox">Pick fruit</button>
          </div>
        </div>,
      );
      await user.click(screen.getByRole('button', { name: 'Pick fruit' }));
      await user.keyboard(`{${modifier}>}`);
      collection.mockClear();
      enclosing.mockClear();
      await user.keyboard('{Enter}');
      expect(collection).not.toHaveBeenCalled();
      expect(enclosing).toHaveBeenCalledOnce();
      await user.keyboard(`{/${modifier}}`);
    },
  );
});
