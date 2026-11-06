import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Fieldset } from '../field/field.js';
import { Combobox, type ComboboxProps } from './combobox.js';

const items = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
];
const locks = [
  ['isDisabled', { isDisabled: true }],
  ['isReadOnly', { isReadOnly: true }],
] as const;

type Lock = { isDisabled?: true; isReadOnly?: true };

function Fruit(props: Partial<ComboboxProps<'single' | 'multiple'>> & Lock) {
  return <Combobox label="Fruit" defaultItems={items} {...props} />;
}

describe('Combobox locking', () => {
  it.each(locks)(
    'UIC-COMBOBOX-5.6 closes an open single list for good when it turns %s',
    async (_, lock) => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const onChange = vi.fn();
      const { rerender } = render(<Fruit onOpenChange={onOpenChange} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: /Fruit/ }));
      const option = await screen.findByRole('option', { name: 'Apple' });
      rerender(<Fruit onOpenChange={onOpenChange} onChange={onChange} {...lock} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onOpenChange.mock.calls).toEqual([
        [true, { reason: 'manual' }],
        [false, { reason: 'lock' }],
      ]);
      expect(screen.getByRole('combobox')).toHaveFocus();
      await user.click(option);
      expect(onChange).not.toHaveBeenCalled();
      rerender(<Fruit onOpenChange={onOpenChange} onChange={onChange} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onOpenChange.mock.calls).toEqual([
        [true, { reason: 'manual' }],
        [false, { reason: 'lock' }],
      ]);
    },
  );

  it('UIC-COMBOBOX-5.6 closes an open multiple list inside a fieldset that turns disabled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const fieldset = (isDisabled: boolean) => (
      <Fieldset legend="Basket" isDisabled={isDisabled}>
        <Fruit selectionMode="multiple" onOpenChange={onOpenChange} />
      </Fieldset>
    );
    const { rerender } = render(fieldset(false));
    await user.click(screen.getByRole('button', { name: /Fruit/ }));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    rerender(fieldset(true));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(fieldset(false));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onOpenChange.mock.calls).toEqual([
      [true, { reason: 'manual' }],
      [false, { reason: 'lock' }],
    ]);
  });

  it('UIC-COMBOBOX-5.6 reports one close for a controlled list and draws it closed while locked', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Fruit isOpen onOpenChange={onOpenChange} />);
    rerender(<Fruit isOpen onOpenChange={onOpenChange} isDisabled />);
    rerender(<Fruit isOpen onOpenChange={onOpenChange} isDisabled />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onOpenChange.mock.calls).toEqual([[false, { reason: 'lock' }]]);
  });

  it('UIC-COMBOBOX-5.6 drops a pending search when the list closes on locking', async () => {
    const user = userEvent.setup();
    let settle: (found: typeof items) => void = () => undefined;
    const loadItems = vi.fn(
      () =>
        new Promise<typeof items>((resolve) => {
          settle = resolve;
        }),
    );
    const { rerender } = render(<Fruit loadItems={loadItems} searchDelay={0} />);
    await user.type(screen.getByRole('combobox'), 'ap');
    await waitFor(() => expect(loadItems).toHaveBeenCalled());
    rerender(<Fruit loadItems={loadItems} searchDelay={0} isDisabled />);
    settle(items);
    rerender(<Fruit loadItems={loadItems} searchDelay={0} />);
    await Promise.resolve();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
