import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { TextField } from '../text-field/text-field.js';
import { FieldRowList, type FieldRowListProps } from './field-row-list.js';

interface Row {
  id: Key;
  name: string;
}

const rows: Row[] = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
];

const renderName = (row: Row, { isDisabled }: { isDisabled: boolean }) => (
  <TextField label="Name" labelLayout="control-only" value={row.name} isDisabled={isDisabled} />
);

/** Applies adds and removes as a caller would, numbering new rows from `next`. */
function Controlled(
  props: Partial<FieldRowListProps<Row>> & { initial?: readonly Row[]; declines?: boolean },
) {
  const { initial = rows, declines = false, ...rest } = props;
  const [value, setValue] = useState<readonly Row[]>(initial);
  const [next, setNext] = useState(1);
  return (
    <FieldRowList<Row>
      rows={value}
      renderRow={renderName}
      onAdd={() => {
        if (declines) return;
        setValue([...value, { id: `new-${next}`, name: '' }]);
        setNext(next + 1);
      }}
      onRemove={(id) => {
        if (!declines) setValue(value.filter((row) => row.id !== id));
      }}
      {...rest}
    />
  );
}

const row = (number: number) => screen.getByRole('group', { name: `Row ${number}` });
const nameOf = (number: number) => within(row(number)).getByRole('textbox', { name: 'Name' });

describe('FieldRowList', () => {
  it('UIC-FIELD-ROW-LIST-1.1 draws numbered rows of caller fields keyed by id', () => {
    const renderRow = vi.fn(renderName);
    const { container } = render(
      <FieldRowList rows={rows} renderRow={renderRow} onAdd={() => {}} onRemove={() => {}} />,
    );
    const items = container.querySelectorAll('.ui-field-row-list__row');
    expect([...items].map((item) => item.getAttribute('data-key'))).toEqual(['a', 'b', 'c']);
    expect(
      [...container.querySelectorAll('.ui-field-row-list__number')].map((n) => n.textContent),
    ).toEqual(['1', '2', '3']);
    expect(container.querySelector('.ui-field-row-list__number')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(nameOf(2)).toHaveValue('Beta');
    expect(renderRow).toHaveBeenCalledWith(rows[1], { index: 1, isDisabled: false });
    expectHooksMatchSpec(container, 'FIELD-ROW-LIST', {
      slots: ['rows', 'row', 'number', 'fields', 'remove', 'add'],
    });
  });

  it('UIC-FIELD-ROW-LIST-1.1 keeps a row’s own field state while rows around it change', async () => {
    const user = userEvent.setup();
    render(
      <Controlled
        renderRow={() => <TextField label="Note" labelLayout="control-only" defaultValue="" />}
      />,
    );
    await user.type(within(row(3)).getByRole('textbox', { name: 'Note' }), 'kept');
    await user.click(screen.getByRole('button', { name: 'Remove row 1' }));
    expect(within(row(2)).getByRole('textbox', { name: 'Note' })).toHaveValue('kept');
  });

  it('UIC-FIELD-ROW-LIST-1.2 shows an empty state without rows', () => {
    const { container } = render(
      <FieldRowList rows={[]} renderRow={renderName} onAdd={() => {}} />,
    );
    expect(container.querySelector('.ui-field-row-list__empty')).toHaveTextContent('No rows yet.');
    expect(container.querySelector('.ui-field-row-list__rows')).toBeNull();
    expectHooksMatchSpec(container, 'FIELD-ROW-LIST', { slots: ['empty', 'add'] });
  });

  it('UIC-FIELD-ROW-LIST-1.3 is a fieldset named by its legend, label or provider string', () => {
    const ref = createRef<HTMLFieldSetElement>();
    const { rerender } = render(
      <FieldRowList
        ref={ref}
        id="limits"
        className="host"
        data-area="limits"
        rows={rows}
        renderRow={renderName}
      />,
    );
    const list = screen.getByRole('group', { name: 'Rows' });
    expect(list).toBe(ref.current);
    expect(list.tagName).toBe('FIELDSET');
    expect(list).toHaveClass('ui-fieldset', 'ui-field-row-list', 'host');
    expect(list).toHaveAttribute('id', 'limits');
    expect(list).toHaveAttribute('data-area', 'limits');
    rerender(<FieldRowList aria-label="Limits" rows={rows} renderRow={renderName} />);
    expect(screen.getByRole('group', { name: 'Limits' })).toBe(list);
    rerender(<FieldRowList legend="Alarm limits" rows={rows} renderRow={renderName} />);
    expect(screen.getByRole('group', { name: 'Alarm limits' })).toBe(list);
    expect(list).not.toHaveAttribute('aria-label');
  });

  it('UIC-FIELD-ROW-LIST-2.1 asks the caller to add and remove, and draws only what it passes', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const numbered = [{ id: 7, name: 'Seven' }];
    const { rerender, container } = render(
      <FieldRowList rows={numbered} renderRow={renderName} onAdd={onAdd} onRemove={onRemove} />,
    );
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await user.click(screen.getByRole('button', { name: 'Remove row 1' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(7);
    expect(container.querySelectorAll('.ui-field-row-list__row')).toHaveLength(1);
    rerender(<FieldRowList rows={numbered} renderRow={renderName} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-FIELD-ROW-LIST-2.2 labels the add and remove buttons', () => {
    render(<Controlled addLabel="Add limit" />);
    expect(screen.getByRole('button', { name: 'Add limit' })).toHaveClass('ui-field-row-list__add');
    expect(screen.getByRole('button', { name: 'Remove row 3' })).toHaveClass(
      'ui-field-row-list__remove',
    );
  });

  it('UIC-FIELD-ROW-LIST-2.3 disables add at maxRows and remove at minRows', async () => {
    const user = userEvent.setup();
    render(<Controlled minRows={2} maxRows={3} />);
    const add = screen.getByRole('button', { name: 'Add row' });
    expect(add).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove row 1' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Remove row 1' }));
    expect(add).toBeEnabled();
    for (const number of [1, 2]) {
      expect(screen.getByRole('button', { name: `Remove row ${number}` })).toBeDisabled();
    }
  });

  it('UIC-FIELD-ROW-LIST-2.3 draws rows beyond the bounds as given', () => {
    render(<Controlled initial={rows} maxRows={2} />);
    expect(screen.getAllByRole('button', { name: /^Remove row/ })).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Add row' })).toBeDisabled();
  });

  it('UIC-FIELD-ROW-LIST-2.4 focuses the new row, then the row that takes a removed one’s place', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    await waitFor(() => expect(nameOf(4)).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Remove row 2' }));
    await waitFor(() => expect(nameOf(2)).toHaveValue('Gamma'));
    await waitFor(() => expect(nameOf(2)).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Remove row 3' }));
    await waitFor(() => expect(nameOf(2)).toHaveFocus());
  });

  it('UIC-FIELD-ROW-LIST-2.4 focuses the add button once the last row is removed', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={[{ id: 'only', name: 'Only' }]} />);
    await user.click(screen.getByRole('button', { name: 'Remove row 1' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add row' })).toHaveFocus());
  });

  it('UIC-FIELD-ROW-LIST-2.4 leaves focus alone when the caller declines the edit', async () => {
    const user = userEvent.setup();
    render(<Controlled declines />);
    const remove = screen.getByRole('button', { name: 'Remove row 1' });
    await user.click(remove);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(remove).toHaveFocus();
  });

  it('UIC-FIELD-ROW-LIST-3.1 disables its buttons and fields, which keep their values', () => {
    const renderRow = vi.fn((row: Row) => (
      <>
        <TextField label="Name" labelLayout="control-only" value={row.name} />
        <input aria-label="Native" defaultValue={row.name} />
      </>
    ));
    const { container } = render(
      <FieldRowList
        rows={rows}
        renderRow={renderRow}
        onAdd={() => {}}
        onRemove={() => {}}
        isDisabled
      />,
    );
    const list = screen.getByRole('group', { name: 'Rows' });
    expect(list).toBeDisabled();
    expect(list).toHaveAttribute('data-disabled', 'true');
    expect(nameOf(1)).toBeDisabled();
    expect(nameOf(1)).toHaveValue('Alpha');
    expect(within(row(2)).getByRole('textbox', { name: 'Native' })).toBeDisabled();
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
    expect(renderRow).toHaveBeenCalledWith(rows[0], { index: 0, isDisabled: true });
    expectHooksMatchSpec(container, 'FIELD-ROW-LIST');
  });
});
