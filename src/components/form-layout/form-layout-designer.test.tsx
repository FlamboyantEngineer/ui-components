import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { TextField } from '../text-field/text-field.js';
import { FormLayoutDesigner } from './form-layout-designer.js';
import type { FormLayoutNode, FormLayoutValue } from './form-layout-tree.js';
import type { FormLayoutTypes } from './form-layout-types.js';
import type { FormLayoutPaletteEntry } from './use-form-layout-designer.js';

const types: FormLayoutTypes = {
  section: { label: 'Section', arrangement: 'stack', accepts: (type) => type !== 'section' },
  row: { label: 'Row', arrangement: 'row', accepts: (type) => type === 'text' },
  text: {
    label: 'Text',
    render: (node) => <TextField label={`${node.label ?? 'Text'} preview`} />,
  },
};

const layout: FormLayoutValue = [
  {
    id: 'contact',
    type: 'section',
    label: 'Contact',
    children: [
      { id: 'name', type: 'text', label: 'Name' },
      {
        id: 'place',
        type: 'row',
        label: 'Place',
        children: [{ id: 'city', type: 'text', label: 'City' }],
      },
    ],
  },
  { id: 'note', type: 'text', label: 'Note', isLocked: true },
];

let created = 0;
const palette: FormLayoutPaletteEntry[] = [
  {
    key: 'text',
    label: 'Text field',
    type: 'text',
    create: () => {
      created += 1;
      return { id: `new-${created}`, type: 'text', label: `Field ${created}` };
    },
  },
  {
    key: 'section',
    label: 'Section',
    type: 'section',
    create: () => ({ id: 'contact', type: 'section' }),
  },
];

const node = (name: string) => screen.getByRole('group', { name });
const ids = (nodes: FormLayoutValue | undefined): string[] =>
  (nodes ?? []).flatMap((item) => [item.id, ...ids(item.children)]);

describe('FormLayoutDesigner', () => {
  it('UIC-FORM-LAYOUT-3.1 UIC-FORM-LAYOUT-3.6 renders its palette, canvas, nodes and hooks', () => {
    const { container } = render(
      <FormLayoutDesigner
        defaultValue={layout}
        defaultSelectedId="name"
        types={types}
        palette={palette}
        renderInspector={(selected) => <p>Editing {selected.label}</p>}
        className="host"
        data-kind="sample"
      />,
    );
    expect(screen.getByRole('group', { name: 'Add to form' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Form layout' })).toBeInTheDocument();
    expect(node('Name')).toHaveAttribute('aria-current', 'true');
    expect(node('Name')).toHaveAccessibleDescription('Alt+Arrow keys move, Delete removes.');
    expect(screen.getByRole('button', { name: 'Move Name' })).toBeInTheDocument();
    expect(screen.getByText('Editing Name')).toBeInTheDocument();
    // A locked node draws no handle and no Remove button.
    expect(node('Note')).toHaveAttribute('data-locked', 'true');
    expect(screen.queryByRole('button', { name: 'Remove Note' })).not.toBeInTheDocument();
    const root = container.querySelector('.ui-form-layout-designer');
    expect(root).toHaveClass('host');
    expect(root).toHaveAttribute('data-kind', 'sample');
    expectHooksMatchSpec(container, 'FORM-LAYOUT', {
      slots: [
        'ui-form-layout-designer__palette',
        'ui-form-layout-designer__palette-item',
        'ui-form-layout-designer__canvas',
        'ui-form-layout-designer__node',
        'ui-form-layout-designer__header',
        'ui-form-layout-designer__handle',
        'ui-form-layout-designer__title',
        'ui-form-layout-designer__remove',
      ],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-FORM-LAYOUT-3.1 shows an empty canvas that takes focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<FormLayoutDesigner types={types} palette={palette} />);
    const canvas = screen.getByRole('group', { name: 'Form layout' });
    expect(canvas).toHaveAttribute('data-empty', 'true');
    expect(canvas).toHaveTextContent('No fields yet. Add one from the palette.');
    // After the palette's two entries.
    await user.tab();
    await user.tab();
    await user.tab();
    expect(canvas).toHaveFocus();
    expect(container.querySelector('.ui-form-layout-designer__slot')).toHaveAccessibleName(
      'End of the form',
    );
  });

  it('UIC-FORM-LAYOUT-3.2 selects by click and focus, with one Tab stop', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <FormLayoutDesigner
        defaultValue={layout}
        types={types}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(node('Contact')).toHaveAttribute('tabindex', '0');
    expect(node('Name')).toHaveAttribute('tabindex', '-1');
    // A click in a nested node's preview selects that node, not its container.
    await user.click(screen.getByRole('textbox', { name: 'City preview' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith('city');
    expect(node('City')).toHaveAttribute('data-selected', 'true');
    expect(node('City')).toHaveAttribute('tabindex', '0');
    expect(node('Contact')).toHaveAttribute('tabindex', '-1');
    await user.click(within(node('Place')).getAllByText('Place')[0] as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith('place');
  });

  it('UIC-FORM-LAYOUT-3.3 moves focus and nodes with the keyboard, announcing each move', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <FormLayoutDesigner defaultValue={layout} types={types} onChange={onChange} />,
    );
    const status = container.querySelector('.ui-form-layout-designer__status');
    node('Contact').focus();
    await user.keyboard('{ArrowDown}');
    expect(node('Name')).toHaveFocus();
    await user.keyboard('{End}');
    expect(node('Note')).toHaveFocus();
    await user.keyboard('{Home}{ArrowDown}');
    expect(node('Name')).toHaveFocus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), {
      kind: 'move',
      id: 'name',
      place: { parentId: 'place', index: 0 },
    });
    expect(status).toHaveTextContent('Name moved to Place, position 1');
    expect(node('Name')).toHaveFocus();
    expect(within(node('Place')).getByRole('group', { name: 'Name' })).toBeInTheDocument();
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(status).toHaveTextContent('Name moved to Contact, position 1');
    // A locked node does not move.
    node('Note').focus();
    onChange.mockClear();
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}{Delete}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-FORM-LAYOUT-3.3 removes with Delete and focuses the neighbour', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <FormLayoutDesigner defaultValue={layout} types={types} onChange={onChange} />,
    );
    node('Name').focus();
    await user.keyboard('{Delete}');
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), { kind: 'remove', id: 'name' });
    expect(node('Place')).toHaveFocus();
    expect(container.querySelector('.ui-form-layout-designer__status')).toHaveTextContent(
      'Name removed',
    );
    await user.click(screen.getByRole('button', { name: 'Remove City' }));
    expect(node('Place')).toHaveFocus();
  });

  it('UIC-FORM-LAYOUT-3.3 UIC-FORM-LAYOUT-3.4 leaves keys and presses in a preview field to the field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormLayoutDesigner defaultValue={layout} types={types} onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Name preview' });
    await user.click(field);
    await user.keyboard('Ada{Backspace}{Alt>}{ArrowDown}{/Alt}{Delete}');
    expect(field).toHaveValue('Ad');
    expect(onChange).not.toHaveBeenCalled();
    await user.pointer({ keys: '[MouseLeft>]', target: field });
    expect(node('Name')).not.toHaveAttribute('draggable');
    await user.pointer({ keys: '[/MouseLeft]', target: field });
    // A press on the handle arms the node for a pointer drag.
    const handle = screen.getByRole('button', { name: 'Move Name' });
    await user.pointer({ keys: '[MouseLeft>]', target: handle });
    expect(node('Name')).toHaveAttribute('draggable', 'true');
    await user.pointer({ keys: '[/MouseLeft]', target: handle });
  });

  it('UIC-FORM-LAYOUT-3.5 adds palette nodes where the selection and rules allow', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Host() {
      const [value, setValue] = useState(layout);
      return (
        <FormLayoutDesigner
          value={value}
          onChange={(next, change) => {
            setValue(next);
            onChange(ids(next), change);
          }}
          defaultSelectedId="place"
          types={types}
          palette={palette}
          renderInspector={(selected, update) => (
            <TextField
              label="Label"
              value={selected.label ?? ''}
              onChange={(label) => update({ ...selected, label } as FormLayoutNode)}
            />
          )}
        />
      );
    }
    render(<Host />);
    created = 0;
    await user.click(screen.getByRole('button', { name: 'Text field' }));
    // Into the selected row, at its end, then selected and focused.
    expect(onChange).toHaveBeenLastCalledWith(
      ['contact', 'name', 'place', 'city', 'new-1', 'note'],
      { kind: 'insert', id: 'new-1', place: { parentId: 'place', index: 1 } },
    );
    expect(node('Field 1')).toHaveFocus();
    // After the selected leaf.
    await user.click(screen.getByRole('button', { name: 'Text field' }));
    expect(onChange.mock.lastCall?.[0]).toEqual([
      'contact',
      'name',
      'place',
      'city',
      'new-1',
      'new-2',
      'note',
    ]);
    // An id the layout already holds adds nothing.
    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Section' }));
    expect(onChange).not.toHaveBeenCalled();
    const label = screen.getByRole('textbox', { name: 'Label' });
    await user.clear(label);
    await user.type(label, 'Phone');
    expect(onChange).toHaveBeenLastCalledWith(expect.any(Array), { kind: 'update', id: 'new-2' });
    expect(node('Phone')).toBeInTheDocument();
  });

  it('UIC-FORM-LAYOUT-3.6 refuses edits while read-only or disabled and keeps designers independent', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <>
        <FormLayoutDesigner
          aria-label="Locked"
          defaultValue={layout}
          types={types}
          palette={palette}
          isReadOnly
          onChange={onChange}
        />
        <FormLayoutDesigner
          aria-label="Off"
          defaultValue={layout}
          types={types}
          isDisabled
          onChange={onChange}
        />
        <FormLayoutDesigner aria-label="Free" defaultValue={layout} types={types} />
      </>,
    );
    const [locked, off, free] = container.querySelectorAll('.ui-form-layout-designer');
    expect(locked).toHaveAttribute('data-read-only', 'true');
    expect(off).toHaveAttribute('data-disabled', 'true');
    expect(within(locked as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
    expect(
      within(off as HTMLElement).queryByRole('button', { name: /^Move/ }),
    ).not.toBeInTheDocument();
    expect(locked?.querySelector('.ui-form-layout-designer__slot')).toBeNull();
    const name = within(locked as HTMLElement).getByRole('group', { name: 'Name' });
    name.focus();
    await user.keyboard('{Delete}{Alt>}{ArrowDown}{/Alt}');
    expect(onChange).not.toHaveBeenCalled();
    expect(name).toHaveAttribute('data-selected', 'true');
    within(free as HTMLElement)
      .getByRole('group', { name: 'Name' })
      .focus();
    await user.keyboard('{Delete}');
    expect(
      within(free as HTMLElement).queryByRole('group', { name: 'Name' }),
    ).not.toBeInTheDocument();
    expect(within(locked as HTMLElement).getByRole('group', { name: 'Name' })).toBeInTheDocument();
  });
});
