import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { SelectField } from './select-field.js';

it('UIC-SELECT-FIELD-3.4 shows mixed options without selecting or submitting them and updates after a pick', async () => {
  const user = userEvent.setup();
  function Example() {
    const [value, setValue] = useState<Key[]>([]);
    const [mixed, setMixed] = useState(true);
    return (
      <form aria-label="Bulk choices">
        <SelectField
          label="Labels"
          name="labels"
          selectionMode="multiple"
          value={value}
          options={[
            {
              id: 'green',
              label: 'Green',
              isIndeterminate: mixed,
              description: mixed ? 'Mixed values — retain existing assignments' : undefined,
            },
          ]}
          onChange={(next) => {
            setValue(next);
            setMixed(false);
          }}
        />
      </form>
    );
  }
  render(<Example />);
  const form = screen.getByRole('form') as HTMLFormElement;
  expect(new FormData(form).getAll('labels')).toEqual([]);
  await user.click(screen.getByRole('button', { name: /Labels$/ }));
  const option = screen.getByRole('option', { name: /Green Mixed values/ });
  expect(option).toHaveAttribute('aria-selected', 'false');
  expect(option.querySelector('.ui-select-field__option-check')).toHaveAttribute(
    'data-indeterminate',
    'true',
  );
  await user.click(option);
  expect(screen.getByRole('option', { name: 'Green' })).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('option', { name: 'Green' }).querySelector('.ui-select-field__option-check'),
  ).not.toHaveAttribute('data-indeterminate');
  expect(new FormData(form).getAll('labels')).toEqual(['green']);
  await user.keyboard('{Enter}');
  expect(new FormData(form).getAll('labels')).toEqual([]);
});

it('UIC-SELECT-FIELD-3.4 does not toggle an option when the opening pointer releases over it', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <SelectField
      label="Labels"
      selectionMode="multiple"
      value={['blue']}
      onChange={onChange}
      options={[
        { id: 'blue', label: 'Blue' },
        { id: 'green', label: 'Green', isIndeterminate: true },
      ]}
    />,
  );
  await user.pointer({
    target: screen.getByRole('button', { name: /Labels$/ }),
    keys: '[MouseLeft>]',
  });
  const option = screen.getByRole('option', { name: 'Green' });
  await user.pointer({ target: option, keys: '[/MouseLeft]' });
  expect(onChange).not.toHaveBeenCalled();
  await user.click(option);
  expect(onChange).toHaveBeenLastCalledWith(['blue', 'green']);
});
