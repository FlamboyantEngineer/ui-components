import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../../../test/field-fixtures.js';
import { Input } from '../../primitives/index.js';
import { Field, useFieldState, type FieldStateOptions } from './field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

/** A field whose control leaves committing to the field, as the library's text controls do. */
function LeavingField({ options }: { options: FieldStateOptions<string> }) {
  const state = useFieldState<string>({ defaultValue: '', ...options });
  return (
    <Field state={state} label="Fruit" help="Ripe only." commitOnBlur>
      {(control) => (
        <Input
          {...control}
          value={state.value}
          onChange={(event) => state.setValue(event.target.value)}
        />
      )}
    </Field>
  );
}

/** The caller holds the committed value and saves the value it is given. */
function SavedField() {
  const [saved, setSaved] = useState('Fig');
  const [value, setValue] = useState('Fig');
  return (
    <>
      <LeavingField options={{ value, onChange: setValue, committedValue: saved }} />
      <button type="button" onClick={() => setSaved(value)}>
        Save
      </button>
    </>
  );
}

/** Sends one half of a focus move, as a browser does in its own task before rendering. */
function dispatchFocus(type: 'focusout' | 'focusin', target: Element, relatedTarget: Element) {
  act(() => {
    target.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget }));
  });
}

describe('Field focus', () => {
  it('UIC-FIELD-1.9 UIC-FIELD-3.7 stays focused and untouched while focus moves between its parts', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextField options={{ isRequired: true, validationMode: 'blur' }} help="Ripe only." />,
    );
    const field = root(container);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    const help = screen.getByRole('button', { name: 'Help for Fruit' });
    await user.click(input);
    // A browser renders between focusout and focusin, which user-event sends in one batch.
    dispatchFocus('focusout', input, help);
    expect(field).toHaveAttribute('data-focused', 'true');
    expect(field).not.toHaveAttribute('data-touched');
    dispatchFocus('focusin', help, input);
    expect(field).toHaveAttribute('data-focused', 'true');
    expect(field).not.toHaveAttribute('data-touched');
    expect(field).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-FIELD-1.9 leaves once focus lands outside it, or when no focus follows', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <TextField options={{ isRequired: true, validationMode: 'blur' }} />
        <button type="button">After</button>
      </>,
    );
    const field = root(container);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    const after = screen.getByRole('button', { name: 'After' });
    await user.click(input);
    dispatchFocus('focusout', input, after);
    expect(field).toHaveAttribute('data-focused', 'true');
    dispatchFocus('focusin', after, input);
    expect(field).not.toHaveAttribute('data-focused');
    expect(field).toHaveAttribute('data-touched', 'true');
    expect(field).toHaveAttribute('data-validation', 'invalid');

    vi.useFakeTimers();
    try {
      await act(async () => after.focus());
      await act(async () => input.focus());
      expect(field).toHaveAttribute('data-focused', 'true');
      dispatchFocus('focusout', input, after);
      act(() => vi.advanceTimersByTime(0));
      expect(field).not.toHaveAttribute('data-focused');
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-FIELD-1.11 UIC-FIELD-4.1 keeps the restore button while Tab reaches it and commits on leaving', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <>
        <LeavingField options={{ defaultValue: 'Fig', onCommit }} />
        <button type="button">After</button>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 's');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Fruit' })).toHaveFocus();
    expect(onCommit).not.toHaveBeenCalled();
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Help for Fruit' })).toHaveFocus();
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('Figs');
    expect(root(container)).not.toHaveAttribute('data-dirty');
    expect(root(container)).toHaveAttribute('data-touched', 'true');
  });

  it('UIC-FIELD-1.11 moves focus to the control when the focused restore button leaves', async () => {
    const user = userEvent.setup();
    const { container } = render(<SavedField />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 's');
    await user.tab();
    const restore = screen.getByRole('button', { name: 'Restore Fruit' });
    expect(restore).toHaveFocus();
    // The value is saved elsewhere while focus rests on the button, which leaves with the dirt.
    act(() => screen.getByRole('button', { name: 'Save' }).click());
    expect(restore).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(root(container)).toHaveAttribute('data-focused', 'true');
    expect(root(container)).not.toHaveAttribute('data-touched');
  });
});
