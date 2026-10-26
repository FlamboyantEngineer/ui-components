import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Form } from '../form/form.js';
import { ChoiceGroup, Choice } from './choice-group.js';

const toppings: Array<{ value: string; label: string; isDisabled?: boolean }> = [
  { value: 'basil', label: 'Basil' },
  { value: 'olives', label: 'Olives' },
  { value: 'peppers', label: 'Peppers' },
  { value: 'truffle', label: 'Truffle', isDisabled: true },
];

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

describe('ChoiceGroup', () => {
  it('UIC-CHOICE-GROUP-4.1 is a field around a checkbox group that starts empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <ChoiceGroup
        selectionMode="multiple"
        label="Toppings"
        onChange={onChange}
        onCommit={onCommit}
      >
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-choice-group');
    const group = screen.getByRole('group', { name: 'Toppings' });
    expect(group).toHaveClass('ui-choice-group__box');
    const boxes = within(group).getAllByRole('checkbox');
    expect(boxes.map((box) => box.closest('label')?.textContent)).toEqual([
      'Basil',
      'Olives',
      'Peppers',
      'Truffle',
    ]);
    expect(boxes.filter((box) => (box as HTMLInputElement).checked)).toEqual([]);
    await user.click(screen.getByText('Olives'));
    expect(onChange).toHaveBeenLastCalledWith(['olives']);
    expect(onCommit).toHaveBeenLastCalledWith(['olives']);
    await user.click(screen.getByText('Basil'));
    expect(onCommit).toHaveBeenLastCalledWith(['olives', 'basil']);
    expect(screen.getByRole('checkbox', { name: 'Truffle' })).toBeDisabled();
    expectHooksMatchSpec(container, 'CHOICE-GROUP', { slots: ['box'] });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-CHOICE-GROUP-4.2 submits each ticked value under its name', async () => {
    const user = userEvent.setup();
    let submitted: string[] = [];
    render(
      <Form
        aria-label="Order"
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget).getAll('toppings') as string[];
        }}
      >
        <ChoiceGroup
          selectionMode="multiple"
          label="Toppings"
          name="toppings"
          defaultValue={['basil']}
        >
          {toppings.map(({ label, ...option }) => (
            <Choice key={option.value} {...option}>
              {label}
            </Choice>
          ))}
        </ChoiceGroup>
        <button type="submit">Order</button>
      </Form>,
    );
    await user.click(screen.getByText('Peppers'));
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual(['basil', 'peppers']);
  });

  it('UIC-CHOICE-GROUP-4.3 reports a required group left empty and describes it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChoiceGroup
        selectionMode="multiple"
        id="toppings"
        label="Toppings"
        description="Pick any."
        isRequired
      >
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    const group = screen.getByRole('group', { name: 'Toppings' });
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(group).toHaveAttribute('data-invalid', 'true');
    expect(group).not.toHaveAttribute('aria-errormessage');
    expect(group).toHaveAccessibleDescription('Pick any. A value is required.');
    expect(screen.getByRole('checkbox', { name: 'Basil' })).toHaveAttribute('aria-invalid', 'true');
    await user.click(screen.getByText('Basil'));
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    expect(group).not.toHaveAttribute('data-invalid');
  });

  it('UIC-CHOICE-GROUP-4.4 ticks and clears every enabled option from a parent box', async () => {
    const user = userEvent.setup();
    function Toppings() {
      const [value, setValue] = useState(['truffle']);
      return (
        <ChoiceGroup
          selectionMode="multiple"
          label="Toppings"
          selectAllLabel="All toppings"
          value={value}
          onChange={setValue}
        >
          {toppings.map(({ label, ...option }) => (
            <Choice key={option.value} {...option}>
              {label}
            </Choice>
          ))}
        </ChoiceGroup>
      );
    }
    const { container } = render(<Toppings />);
    const parent = screen.getByRole<HTMLInputElement>('checkbox', { name: 'All toppings' });
    expect(parent.closest('.ui-checkbox')).toHaveClass('ui-choice-group__select-all');
    expect(parent).not.toBeChecked();
    expect(parent.indeterminate).toBe(false);
    await user.click(screen.getByText('Olives'));
    expect(parent.indeterminate).toBe(true);
    await user.click(parent);
    expect(parent).toBeChecked();
    expect(parent.indeterminate).toBe(false);
    expect(screen.getByRole('checkbox', { name: 'Peppers' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Truffle' })).toBeChecked();
    await user.click(parent);
    expect(screen.getByRole('checkbox', { name: 'Basil' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Truffle' })).toBeChecked();
    expectHooksMatchSpec(container, 'CHOICE-GROUP', { slots: ['box', 'select-all'] });
  });

  it('UIC-CHOICE-GROUP-4.5 shows dirty state, restores, undoes and refuses changes while locked', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ChoiceGroup
        selectionMode="multiple"
        label="Toppings"
        committedValue={['basil']}
        menu={['clear']}
      >
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    await user.click(screen.getByText('Olives'));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Toppings' }));
    expect(screen.getByRole('checkbox', { name: 'Olives' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Basil' })).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(screen.getByRole('checkbox', { name: 'Olives' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Toppings actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(
      screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked),
    ).toEqual([]);
    rerender(
      <ChoiceGroup selectionMode="multiple" label="Toppings" value={['basil']} isReadOnly>
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    await user.click(screen.getByText('Olives'));
    expect(screen.getByRole('checkbox', { name: 'Olives' })).not.toBeChecked();
    rerender(
      <ChoiceGroup selectionMode="multiple" label="Toppings" value={['basil']} isDisabled>
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    expect(screen.getByRole('checkbox', { name: 'Olives' })).toBeDisabled();
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
  });

  it('UIC-CHOICE-GROUP-4.6 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <ChoiceGroup
        selectionMode="multiple"
        id="toppings"
        label="Toppings"
        className="wide"
        data-test="group"
      >
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    expect(root(container)).toHaveClass('ui-choice-group', 'wide');
    expect(root(container)).toHaveAttribute('id', 'toppings');
    expect(root(container)).toHaveAttribute('data-test', 'group');
    expect(screen.getByRole('group')).toHaveAttribute('id', 'toppings-control');
    expectHooksMatchSpec(container, 'CHOICE-GROUP', { callerAttributes: ['data-test'] });
  });

  it('UIC-CHOICE-GROUP-4.1 UIC-FIELD-1.10 gives its checkboxes the field size', () => {
    const { container } = render(
      <ChoiceGroup selectionMode="multiple" label="Toppings" size="sm" selectAllLabel="All">
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    expect(root(container)).toHaveAttribute('data-size', 'sm');
    const sizes = [...container.querySelectorAll('.ui-checkbox')].map((box) =>
      box.getAttribute('data-size'),
    );
    expect(new Set(sizes)).toEqual(new Set(['sm']));
  });
  it('UIC-CHOICE-GROUP-4.4 keeps disabled and unlisted values when selecting and clearing all', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChoiceGroup
        selectionMode="multiple"
        label="Toppings"
        defaultValue={['truffle', 'unlisted']}
        selectAllLabel="All toppings"
        onChange={onChange}
      >
        {toppings.map(({ label, ...option }) => (
          <Choice key={option.value} {...option}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>,
    );
    const parent = screen.getByRole('checkbox', { name: 'All toppings' });
    await user.click(parent);
    expect(onChange).toHaveBeenLastCalledWith([
      'truffle',
      'unlisted',
      'basil',
      'olives',
      'peppers',
    ]);
    await user.click(parent);
    expect(onChange).toHaveBeenLastCalledWith(['truffle', 'unlisted']);
  });
});

it('UIC-CHOICE-GROUP-4.1 UIC-CHOICE-GROUP-4.4 preserves rich descriptions and updates select-all when choices become disabled', async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <ChoiceGroup selectionMode="multiple" label="Fruit" selectAllLabel="All fruit">
      <Choice value="pear" description="Ready today.">
        <strong>Pear</strong>
      </Choice>
      <Choice value="plum">Plum</Choice>
    </ChoiceGroup>,
  );
  expect(screen.getByRole('checkbox', { name: 'Pear' })).toHaveAccessibleDescription(
    'Ready today.',
  );
  rerender(
    <ChoiceGroup selectionMode="multiple" label="Fruit" selectAllLabel="All fruit">
      <Choice value="pear" description="Ready today.">
        <strong>Pear</strong>
      </Choice>
      <Choice value="plum" isDisabled>
        Plum
      </Choice>
    </ChoiceGroup>,
  );
  await user.click(screen.getByRole('checkbox', { name: 'All fruit' }));
  expect(screen.getByRole('checkbox', { name: 'Pear' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Plum' })).not.toBeChecked();
});
