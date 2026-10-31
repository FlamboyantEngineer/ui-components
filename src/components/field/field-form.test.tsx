import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Input } from '../../primitives/index.js';
import { Field, useFieldState } from './field.js';

/** A field whose input belongs to the form named by `form`, wherever the field sits. */
function OwnedField({ form }: { form: string }) {
  const state = useFieldState<string>({ defaultValue: 'initial' });
  return (
    <Field state={state} label="Note">
      {(control) => (
        <Input
          {...control}
          form={form}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
        />
      )}
    </Field>
  );
}

function resetForm(id: string) {
  const form = document.getElementById(id) as HTMLFormElement;
  fireEvent.reset(form);
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

describe('Field in a form', () => {
  it('UIC-FIELD-1.9 publishes focus, touched and filled states on its root', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <TextField label="Fruit" options={{ defaultValue: '' }} help="Ripe only." />
        <button type="button">After</button>
      </>,
    );
    const field = root(container);
    expect(field).not.toHaveAttribute('data-focused');
    expect(field).not.toHaveAttribute('data-touched');
    expect(field).not.toHaveAttribute('data-filled');
    await user.tab();
    expect(field).toHaveAttribute('data-focused', 'true');
    await user.keyboard('Fig{Enter}');
    expect(field).toHaveAttribute('data-filled', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Help for Fruit' })).toHaveFocus();
    expect(field).toHaveAttribute('data-focused', 'true');
    expect(field).not.toHaveAttribute('data-touched');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(field).not.toHaveAttribute('data-focused');
    expect(field).toHaveAttribute('data-touched', 'true');
    expectHooksMatchSpec(container, 'FIELD');
  });

  it('UIC-FIELD-3.7 shows a blur mode field validation once focus leaves it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextField options={{ defaultValue: '', isRequired: true, validationMode: 'blur' }} />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    await user.click(input);
    await user.tab();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('A value is required.');
  });

  it('UIC-FIELD-3.10 gives the control its error as custom validity in the native behavior', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Order">
        <TextField options={{ defaultValue: '', isRequired: true, validationBehavior: 'native' }} />
      </form>,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Fruit' });
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Order' });
    expect(input.validity.customError).toBe(true);
    expect(input.validationMessage).toBe('A value is required.');
    expect(form.checkValidity()).toBe(false);
    await user.type(input, 'Fig');
    expect(input.validity.valid).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });

  it('UIC-FIELD-3.10 leaves custom validity alone in the aria behavior', () => {
    render(<TextField options={{ defaultValue: '', isRequired: true }} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Fruit' });
    expect(input.validity.valid).toBe(true);
  });

  it('UIC-FIELD-3.10 shows its validation when the browser reports the control invalid', () => {
    const { container } = render(
      <form aria-label="Order">
        <TextField
          options={{
            defaultValue: '',
            isRequired: true,
            validationBehavior: 'native',
            validationMode: 'submit',
          }}
        />
      </form>,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Fruit' });
    const invalid = new Event('invalid', { cancelable: true });
    act(() => {
      input.dispatchEvent(invalid);
    });
    expect(invalid.defaultPrevented).toBe(false);
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
  });

  it('UIC-FIELD-2.6 resets with the form its control belongs to now', async () => {
    const user = userEvent.setup();
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    const view = (form: string) => (
      <>
        <form id="first" aria-label="First" />
        <form id="second" aria-label="Second" />
        <OwnedField form={form} />
      </>
    );
    const { rerender } = render(view('first'));
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Note' });
    await user.clear(input);
    await user.type(input, 'edited');
    rerender(view('second'));
    resetForm('first');
    await settle();
    expect(input).toHaveValue('edited');
    resetForm('second');
    await settle();
    expect(input).toHaveValue('initial');
    await user.type(input, ' again');
    rerender(view('first'));
    resetForm('first');
    await settle();
    expect(input).toHaveValue('initial');
  });
});
