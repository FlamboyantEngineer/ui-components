import { PlusGlyph } from '../../core/glyphs.js';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { SelectField, type SelectFieldOption } from './select-field.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple', icon: PlusGlyph },
  { id: 'pear', label: 'Pear' },
  { id: 'plum', label: 'Plum' },
  { id: 'fig', label: 'Fig' },
];

function chips() {
  return screen.getByRole('grid', { name: 'Fruit selected values' });
}

function chipLabels() {
  return within(chips())
    .getAllByRole('row')
    .map((row) => row.querySelector('.ui-select-field__chip-label')?.textContent);
}

describe('SelectField chips', () => {
  it('UIC-SELECT-FIELD-4.1 shows each chosen value as a chip in value order', () => {
    const { container } = render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['apple', 'fig', 'kiwi']}
      />,
    );
    expect(chips()).toHaveClass('ui-select-field__chip-list');
    expect(chips().closest('.ui-select-field__chips')).not.toBeNull();
    expect(chipLabels()).toEqual(['Apple', 'Fig', 'kiwi']);
    const [apple, , kiwi] = within(chips()).getAllByRole('row');
    expect(apple?.querySelector('.ui-select-field__chip-icon')).toHaveClass('ui-icon');
    expect(kiwi).toHaveAttribute('data-missing', 'true');
    expectHooksMatchSpec(container, 'SELECT-FIELD', {
      slots: ['chips', 'chip-list', 'chip', 'chip-icon', 'chip-label', 'chip-remove'],
    });
  });

  it('UIC-SELECT-FIELD-4.1 names the chips from the field label when no label is drawn', () => {
    render(
      <SelectField
        label="Fruit"
        labelLayout="control-only"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['pear']}
      />,
    );
    expect(chipLabels()).toEqual(['Pear']);
  });

  it('UIC-SELECT-FIELD-4.1 moves between chips with the arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['apple', 'pear']}
      />,
    );
    const [apple, pear] = within(chips()).getAllByRole('row');
    act(() => apple?.focus());
    await user.keyboard('{ArrowRight}');
    expect(pear).toHaveFocus();
  });

  it('UIC-SELECT-FIELD-4.2 removes a value from its button or with Delete and commits', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['apple', 'pear', 'fig']}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Pear' }));
    expect(onCommit).toHaveBeenLastCalledWith(['apple', 'fig']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const fig = within(chips()).getByRole('row', { name: 'Fig' });
    act(() => fig.focus());
    await user.keyboard('{Delete}');
    expect(onCommit).toHaveBeenLastCalledWith(['apple']);
    expect(chipLabels()).toEqual(['Apple']);
  });

  it('UIC-SELECT-FIELD-4.2 offers no removal on read-only and disabled selects', () => {
    for (const lock of [{ isReadOnly: true }, { isDisabled: true }]) {
      const { unmount } = render(
        <SelectField
          label="Fruit"
          selectionMode="multiple"
          options={fruit}
          defaultValue={['apple']}
          {...lock}
        />,
      );
      const apple = within(chips()).getByRole('row', { name: 'Apple' });
      expect(apple).not.toHaveAttribute('data-allows-removing');
      expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
      expect(apple).toHaveAttribute('tabindex', '0');
      unmount();
    }
  });

  it('UIC-SELECT-FIELD-4.3 marks added chips and restores removed committed values', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    // The caller holds the value and takes each change, so a restore commits what it renders.
    function Picked() {
      const [value, setValue] = useState<Key[]>(['pear', 'plum']);
      return (
        <SelectField
          label="Fruit"
          selectionMode="multiple"
          options={fruit}
          committedValue={['apple', 'pear']}
          value={value}
          onChange={setValue}
          onCommit={onCommit}
        />
      );
    }
    const { container } = render(<Picked />);
    const rows = within(chips()).getAllByRole('row');
    expect(rows.map((row) => row.getAttribute('data-change'))).toEqual([null, 'added']);
    const removed = container.querySelector('.ui-select-field__removed');
    expect(removed).toHaveClass('ui-field-previous-value');
    expect(removed?.querySelector('del')).toHaveTextContent('Apple');
    expect(removed?.querySelector('.ui-select-field__chip-icon')).not.toBeNull();
    expectHooksMatchSpec(container, 'SELECT-FIELD', { slots: ['removed'] });
    await user.click(screen.getByRole('button', { name: 'Restore Apple' }));
    expect(onCommit).toHaveBeenCalledWith(['apple', 'pear', 'plum']);
    expect(container.querySelector('.ui-select-field__removed')).toBeNull();
  });

  it('UIC-SELECT-FIELD-4.4 draws the chips inside a chip frame before the select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        chipPlacement="inside"
        options={fruit}
        defaultValue={['apple', 'pear']}
        onChange={onChange}
      />,
    );
    const root = container.querySelector('.ui-select-field');
    expect(root).toHaveAttribute('data-chip-placement', 'inside');
    const frame = requireFrame(container);
    const trigger = screen.getByRole('button', { name: /Fruit/ });
    expect(frame).toContainElement(chips());
    expect(frame).toContainElement(trigger);
    expect(
      chips().compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The chips keep their own keys: Delete on a chip removes it.
    const [apple] = within(chips()).getAllByRole('row');
    act(() => apple?.focus());
    await user.keyboard('{Delete}');
    expect(onChange).toHaveBeenLastCalledWith(['pear']);
    await user.click(screen.getByRole('button', { name: 'Remove Pear' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    await user.click(trigger);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-4.4 keeps the chips below a single select’s default and a below select', () => {
    const { container, rerender } = render(
      <SelectField label="Fruit" selectionMode="multiple" options={fruit} defaultValue={['fig']} />,
    );
    expect(container.querySelector('.ui-select-field')).toHaveAttribute(
      'data-chip-placement',
      'below',
    );
    expect(container.querySelector('.ui-select-field__chip-frame')).toBeNull();
    rerender(<SelectField label="Fruit" chipPlacement="inside" options={fruit} />);
    expect(container.querySelector('.ui-select-field')).not.toHaveAttribute('data-chip-placement');
  });
});

function requireFrame(container: HTMLElement) {
  const frame = container.querySelector<HTMLElement>('.ui-select-field__chip-frame');
  if (!frame) throw new Error('The select has no frame.');
  return frame;
}
