import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectField, type SelectFieldOption } from './select-field.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'fig', label: 'Fig' },
  { id: 'kiwi', label: 'Kiwi' },
];

describe('SelectField limits', () => {
  it('UIC-SELECT-FIELD-8.2 disables the other options once the maximum is reached', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Basket"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['apple']}
        maxValues={2}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Basket$/ }));
    expect(screen.getByRole('option', { name: 'Fig' })).not.toHaveAttribute('aria-disabled');
    await user.click(screen.getByRole('option', { name: 'Pear' }));
    expect(onCommit).toHaveBeenLastCalledWith(['apple', 'pear']);
    // The list redraws its rows after the commit; under load that can trail the press.
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Fig' })).toHaveAttribute('aria-disabled', 'true'),
    );
    expect(screen.getByRole('option', { name: 'Apple' })).not.toHaveAttribute('aria-disabled');
    await user.click(screen.getByRole('option', { name: 'Kiwi' }));
    expect(onCommit).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onCommit).toHaveBeenLastCalledWith(['pear']);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Kiwi' })).not.toHaveAttribute('aria-disabled'),
    );
  });

  it('UIC-SELECT-FIELD-8.2 disables restoring a removed value while full and ignores single selects', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SelectField
        label="Basket"
        selectionMode="multiple"
        options={fruit}
        committedValue={['apple']}
        value={['pear', 'fig']}
        maxValues={2}
      />,
    );
    expect(screen.getByRole('button', { name: 'Restore Apple' })).toBeDisabled();
    rerender(<SelectField label="Fruit" options={fruit} defaultValue="apple" maxValues={0} />);
    await user.click(screen.getByRole('button', { name: /Fruit$/ }));
    expect(screen.getByRole('option', { name: 'Fig' })).not.toHaveAttribute('aria-disabled');
  });

  it('UIC-SELECT-FIELD-8.2 counts values, not known options, so a missing value cannot be restored past the limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SelectField
        label="Basket"
        selectionMode="multiple"
        options={[{ id: 'apple', label: 'Apple' }]}
        value={['apple']}
        committedValue={['missing']}
        maxValues={1}
        onChange={onChange}
      />,
    );
    const restore = screen.getByRole('button', { name: 'Restore missing' });
    expect(restore).toBeDisabled();
    await user.click(restore);
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <SelectField
        label="Basket"
        selectionMode="multiple"
        options={[]}
        value={['apple']}
        committedValue={['missing']}
        maxValues={0}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Restore missing' })).toBeDisabled();
    // A removal frees room again.
    await user.click(screen.getByRole('button', { name: /Remove apple/i }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
