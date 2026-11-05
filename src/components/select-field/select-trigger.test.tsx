import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { SelectField, type SelectFieldOption } from './select-field.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'fig', label: 'Fig' },
];

it('UIC-SELECT-FIELD-2.1 UIC-SELECT-FIELD-2.2 reveals a cut label without opening the picker', async () => {
  const user = userEvent.setup();
  render(<SelectField label="Fruit" options={fruit} defaultValue="apple" />);
  const label = screen.getByText('Apple', { selector: '.ui-select-field__value-label' });
  Object.defineProperty(label, 'clientWidth', { configurable: true, value: 80 });
  Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 80 });
  await user.hover(label);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  await user.unhover(label);
  Object.defineProperty(label, 'scrollWidth', { configurable: true, value: 140 });
  await user.hover(label);
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Apple');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  await user.unhover(label);
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  await user.tab();
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Apple');
  expect(screen.getByRole('button', { name: 'Apple Fruit' })).toHaveFocus();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
});

describe('SelectField clear button', () => {
  it('UIC-SELECT-FIELD-8.1 clears a single value in one press and focuses the trigger', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="pear"
        isClearable
        onCommit={onCommit}
      />,
    );
    const clear = screen.getByRole('button', { name: 'Clear Fruit' });
    expect(clear).toHaveClass('ui-select-field__clear', 'ui-button');
    expect(clear.closest('.ui-select-field__frame')).not.toBeNull();
    expect(clear.closest('.ui-select-field__trigger')).toBeNull();
    expectHooksMatchSpec(container, 'SELECT-FIELD', { slots: ['clear'] });
    await user.click(clear);
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select an option Fruit' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-8.1 clears a multiple value from the keyboard', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider messages={{ clearValue: 'Vider {label}' }}>
        <SelectField
          label="Basket"
          selectionMode="multiple"
          options={fruit}
          defaultValue={['apple', 'fig']}
          isClearable
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    screen.getByRole('button', { name: 'Vider Basket' }).focus();
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-8.1 offers no clear button when the field cannot be cleared', () => {
    const { rerender } = render(<SelectField label="Fruit" options={fruit} isClearable />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} value="pear" isClearable isRequired />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} value="pear" isClearable isReadOnly />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} value="pear" />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
  });
});

describe('SelectField trigger ref', () => {
  it('UIC-SELECT-FIELD-2.4 hands the list trigger to an object ref that restores focus', async () => {
    const user = userEvent.setup();
    const triggerRef = createRef<HTMLButtonElement>();
    const { unmount } = render(
      <>
        <SelectField label="Fruit" options={fruit} triggerRef={triggerRef} />
        <button type="button">Elsewhere</button>
      </>,
    );
    const trigger = screen.getByRole('button', { name: /Fruit$/ });
    expect(triggerRef.current).toBe(trigger);
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    triggerRef.current?.focus();
    expect(trigger).toHaveFocus();
    unmount();
    expect(triggerRef.current).toBeNull();
  });

  it('UIC-SELECT-FIELD-2.4 attaches a tree trigger callback ref once across re-renders', () => {
    const calls: Array<string | null> = [];
    const triggerRef = (node: HTMLButtonElement | null) => {
      calls.push(node ? node.tagName : null);
    };
    const tree = [{ id: 'fruit', label: 'Fruit', children: [{ id: 'fig', label: 'Fig' }] }];
    const field = (description: string) => (
      <SelectField
        mode="tree"
        label="Kind"
        description={description}
        items={tree}
        getTextValue={(item) => item.label}
        triggerRef={triggerRef}
      />
    );
    const { rerender, unmount } = render(field('First'));
    rerender(field('Second'));
    expect(calls).toEqual(['BUTTON']);
    expect(screen.getByRole('button', { name: /Kind/ })).toHaveClass('ui-select-field__trigger');
    unmount();
    expect(calls).toEqual(['BUTTON', null]);
  });
});
