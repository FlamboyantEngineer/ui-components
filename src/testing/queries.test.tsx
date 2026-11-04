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

describe('testing queries in a shadow root', () => {
  it('UIC-TESTING-3.2 reads the messages a control in a shadow root names in its own tree', () => {
    const host = document.body.appendChild(document.createElement('div'));
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<input aria-describedby="hint problem"><p id="hint" class="ui-field__description">Pick one.</p><p id="problem" class="ui-field__message">Required.</p>';
    // Elements with the same IDs in the document are another tree's.
    document.body.insertAdjacentHTML(
      'beforeend',
      '<p id="hint" class="ui-field__description">Page hint</p><p id="problem" class="ui-field__message">Page error</p>',
    );
    const input = shadow.querySelector('input') as HTMLInputElement;
    expect(getFieldError(input)).toBe('Required.');
    expect(getFieldDescription(input)).toBe('Pick one.');
    const light = document.body.appendChild(document.createElement('input'));
    light.setAttribute('aria-describedby', 'problem');
    expect(getFieldError(light)).toBe('Page error');
    document.body.replaceChildren();
  });
});
