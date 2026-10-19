import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Combobox } from '../components/combobox/combobox.js';
import { SelectField } from '../components/select-field/select-field.js';
import { getFieldDescription, getFieldError, getHookElement } from './index.js';

const fruit = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
];

describe('testing queries', () => {
  it('UIC-TESTING-3.1 finds a root or slot hook element and names a missing one', () => {
    const { container } = render(
      <SelectField label="Fruit" options={fruit} defaultValue="apple" />,
    );
    const root = getHookElement(container, 'select-field');
    expect(root).toHaveClass('ui-select-field');
    expect(getHookElement(root, 'select-field')).toBe(root);
    expect(getHookElement(root, 'select-field', 'trigger')).toBe(
      screen.getByRole('button', { name: 'Apple Fruit' }),
    );
    expect(() => getHookElement(root, 'select-field', 'chips')).toThrow(
      'No element with the hook class ui-select-field__chips is rendered.',
    );
  });

  it('UIC-TESTING-3.2 reads the error and description a field control announces', () => {
    const { container, rerender } = render(
      <SelectField label="Fruit" options={fruit} description="Pick one." isRequired />,
    );
    const field = getHookElement(container, 'select-field');
    expect(getFieldError(field)).toBe('A value is required.');
    expect(getFieldDescription(field)).toBe('Pick one.');
    rerender(<SelectField label="Fruit" options={fruit} defaultValue="pear" />);
    expect(getFieldError(field)).toBeNull();
    expect(getFieldDescription(field)).toBeNull();
  });

  it('UIC-TESTING-3.2 skips warnings and reads a combobox from its input', () => {
    const { rerender } = render(
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="pear"
        validate={() => ({ severity: 'warning', message: 'Pears are seasonal.' })}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Pear Fruit' });
    expect(getFieldError(trigger)).toBeNull();
    rerender(
      <Combobox
        label="Fruit"
        description="Type a fruit."
        errorMessage="Choose a fruit."
        isInvalid
        defaultItems={fruit}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    expect(getFieldError(input)).toBe('Choose a fruit.');
    expect(getFieldDescription(input)).toBe('Type a fruit.');
  });
});
