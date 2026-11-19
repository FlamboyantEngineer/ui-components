import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type Ref, useState } from 'react';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './composed.js';

function Capacity({
  onValue,
  valueRef,
  groupRef,
  itemRef,
}: {
  onValue: (value: Key | null) => void;
  valueRef: Ref<HTMLSpanElement>;
  groupRef: Ref<HTMLElement>;
  itemRef: Ref<HTMLDivElement>;
}) {
  const [value, setValue] = useState<Key | null>(null);
  return (
    <Select
      label="Capacity"
      value={value}
      onChange={(key) => {
        setValue(key);
        onValue(key);
      }}
      name="capacity"
      form="booking"
      placeholder="Pick a size"
    >
      <SelectTrigger>
        <SelectValue ref={valueRef} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup ref={groupRef} id="available" title="Available">
          <SelectItem ref={itemRef} id={1} label="One seat" />
          <SelectItem id="1" label="Solo table" />
          <SelectItem id="vip" label="Private room" isDisabled />
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

it('UIC-SELECT-FIELD-15.1 composes a labelled single select with original keys and native form data', async () => {
  const user = userEvent.setup();
  const onValue = vi.fn();
  const valueRef = vi.fn();
  const groupRef = vi.fn();
  const itemRef = vi.fn();
  const onSubmit = vi.fn((event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new FormData(event.currentTarget).get('capacity');
  });
  render(
    <>
      <form id="booking" onSubmit={onSubmit}>
        <button type="submit">Book</button>
      </form>
      <Capacity onValue={onValue} valueRef={valueRef} groupRef={groupRef} itemRef={itemRef} />
    </>,
  );
  const trigger = screen.getByRole('button', { name: /Pick a size.*Capacity/ });
  expect(valueRef).toHaveBeenLastCalledWith(trigger.querySelector('.ui-select-field__value'));
  await user.click(trigger);
  const group = within(await screen.findByRole('listbox')).getByRole('group', {
    name: 'Available',
  });
  expectHooksMatchSpec(document.body, 'SELECT-FIELD', {
    slots: [
      'select',
      'select-label',
      'frame',
      'trigger',
      'value',
      'value-label',
      'popover',
      'listbox',
      'section',
      'option',
    ],
  });
  expect(within(group).getByRole('option', { name: 'Private room' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  const option = within(group).getByRole('option', { name: 'One seat' });
  expect(groupRef).toHaveBeenLastCalledWith(group);
  expect(itemRef).toHaveBeenLastCalledWith(option);
  await user.click(option);
  expect(onValue).toHaveBeenLastCalledWith(1);
  expect(trigger).toHaveAccessibleName(/One seat.*Capacity/);
  await waitFor(() => expect(trigger).toHaveFocus());
  await user.keyboard('{Enter}');
  await user.click(await screen.findByRole('option', { name: 'Solo table' }));
  expect(onValue).toHaveBeenLastCalledWith('1');
  await user.click(screen.getByRole('button', { name: 'Book' }));
  expect(onSubmit).toHaveReturnedWith('1');
});
