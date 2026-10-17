import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Fieldset } from './fieldset.js';

describe('Fieldset', () => {
  it('UIC-FIELD-10.1 groups fields under a legend that names the group', () => {
    const { container } = render(
      <Fieldset legend="Delivery" id="delivery" className="wide" data-test="group">
        <TextField label="Street" />
        <TextField label="City" />
      </Fieldset>,
    );
    const group = screen.getByRole('group', { name: 'Delivery' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveClass('ui-fieldset', 'wide');
    expect(group).toHaveAttribute('id', 'delivery');
    expect(group).toHaveAttribute('data-test', 'group');
    expect(container.querySelector('legend')).toHaveClass('ui-fieldset__legend');
    expect(group).not.toHaveAttribute('data-disabled');
    expect(screen.getByRole('textbox', { name: 'City' })).toBeEnabled();
    expectHooksMatchSpec(container, 'FIELD', {
      slots: ['legend'],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-FIELD-10.2 disables every field inside, nested groups included', () => {
    const { container } = render(
      <Fieldset legend="Payment" isDisabled>
        <TextField label="Card holder" options={{ committedValue: 'Ada', value: 'Grace' }} />
        <Fieldset legend="Billing">
          <TextField label="Postcode" />
          <button type="button">Look up</button>
        </Fieldset>
      </Fieldset>,
    );
    const [outer, inner] = container.querySelectorAll('fieldset');
    expect(outer).toBeDisabled();
    expect(outer).toHaveAttribute('data-disabled', 'true');
    expect(inner).toHaveAttribute('data-disabled', 'true');
    const holder = screen.getByRole('textbox', { name: 'Card holder' });
    expect(holder).toBeDisabled();
    expect(holder.closest('.ui-field')).toHaveAttribute('data-disabled', 'true');
    expect(holder.closest('.ui-field')).not.toHaveAttribute('data-dirty');
    expect(screen.getByRole('textbox', { name: 'Postcode' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Look up' })).toBeDisabled();
    expectHooksMatchSpec(container, 'FIELD');
  });
});
