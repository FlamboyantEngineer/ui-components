import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { inShadow, ShadowHost, shadowRootOf } from '../../../test/shadow-fixtures.js';
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

const sameMembers = (left: ReadonlySet<string>, right: ReadonlySet<string>) =>
  left.size === right.size && [...left].every((member) => right.has(member));

/** A field whose value is a set, compared by its members; a button picks another set. */
function SetField() {
  const state = useFieldState<ReadonlySet<string>>(
    { defaultValue: new Set(['A']) },
    { isEqual: sameMembers },
  );
  return (
    <Field state={state} label="Custom selection">
      {(control) => (
        <>
          <Input {...control} readOnly value={[...state.value].join(',')} />
          <button type="button" onClick={() => state.setValue(new Set(['B']))}>
            Pick B
          </button>
        </>
      )}
    </Field>
  );
}

/** A field whose value the default comparison cannot read: a bigint, compared by identity. */
function CountField() {
  const state = useFieldState<bigint>({ defaultValue: 1n }, { isEqual: (a, b) => a === b });
  return (
    <Field state={state} label="Count">
      {(control) => (
        <>
          <Input {...control} readOnly value={state.value.toString()} />
          <button type="button" onClick={() => state.setValue(state.value + 1n)}>
            Add one
          </button>
        </>
      )}
    </Field>
  );
}

const warning = { severity: 'warning', message: 'Check the spelling.' } as const;

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

  it('UIC-FIELD-3.10 leaves an invalid event of a field nested in it to that field', () => {
    const native = { validationBehavior: 'native', validationMode: 'submit' } as const;
    const { container } = render(
      <form aria-label="Order">
        <TextField
          label="Fruit"
          options={{ ...native, defaultValue: 'Fig', validate: () => warning }}
          description={
            <TextField label="Note" options={{ ...native, defaultValue: '', isRequired: true }} />
          }
        />
      </form>,
    );
    const [outer, inner] = container.querySelectorAll<HTMLElement>('.ui-field');
    const note = screen.getByRole<HTMLInputElement>('textbox', { name: 'Note' });
    act(() => {
      note.dispatchEvent(new Event('invalid', { cancelable: true }));
    });
    expect(inner).toHaveAttribute('data-validation', 'invalid');
    expect(outer).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-FIELD-2.6 restores a custom value by the field’s own value equality', async () => {
    const user = userEvent.setup();
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    render(
      <form aria-label="Custom">
        <SetField />
        <CountField />
        <TextField label="Note" options={{ defaultValue: 'initial' }} />
        <button type="reset">Reset</button>
      </form>,
    );
    const selection = screen.getByRole('textbox', { name: 'Custom selection' });
    const count = screen.getByRole('textbox', { name: 'Count' });
    const note = screen.getByRole('textbox', { name: 'Note' });
    await user.type(note, ' edited');
    await user.click(screen.getByRole('button', { name: 'Pick B' }));
    await user.click(screen.getByRole('button', { name: 'Add one' }));
    expect(selection).toHaveValue('B');
    expect(count).toHaveValue('2');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await settle();
    expect(selection).toHaveValue('A');
    expect(count).toHaveValue('1');
    expect(note).toHaveValue('initial');
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

  it('UIC-FIELD-2.6 keeps a control whose form names no form out of the form around the field', async () => {
    const user = userEvent.setup();
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    const view = (hasOwner: boolean) => (
      <>
        <form id="nearby" aria-label="Nearby form">
          <OwnedField form="missing-form" />
        </form>
        {hasOwner ? <form id="missing-form" aria-label="Owner" /> : null}
      </>
    );
    const { rerender } = render(view(false));
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Note' });
    expect(input.form).toBeNull();
    await user.clear(input);
    await user.type(input, 'edited');
    resetForm('nearby');
    await settle();
    expect(input).toHaveValue('edited');
    rerender(view(true));
    resetForm('missing-form');
    await settle();
    expect(input).toHaveValue('initial');
  });

  it('UIC-FIELD-2.6 resets a field in a form inside a shadow root, and keeps it through a cancelled reset', async () => {
    let isCancelling = true;
    render(
      <ShadowHost name="panel">
        <form onReset={(event) => isCancelling && event.preventDefault()}>
          <TextField label="Fruit" options={{ defaultValue: 'Fig' }} />
        </form>
      </ShadowHost>,
    );
    const input = inShadow('panel').getByRole('textbox', { name: 'Fruit' });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event's typing does not reach a React input inside a shadow root
    fireEvent.change(input, { target: { value: 'Pear' } });
    expect(input).toHaveValue('Pear');
    const form = shadowRootOf('panel').querySelector('form') as HTMLFormElement;
    const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    act(() => form.reset());
    await settle();
    expect(input).toHaveValue('Pear');
    isCancelling = false;
    act(() => form.reset());
    await settle();
    expect(input).toHaveValue('Fig');
  });
});
