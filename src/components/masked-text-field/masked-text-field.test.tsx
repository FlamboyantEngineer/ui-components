import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MaskedTextField, type MaskedTextFieldProps } from './masked-text-field.js';

function textbox(name = 'Phone') {
  return screen.getByRole<HTMLInputElement>('textbox', { name });
}

function Phone(props: Partial<MaskedTextFieldProps>) {
  return (
    <form aria-label="Contact">
      <MaskedTextField label="Phone" mask="(999) 999-9999" name="phone" {...props} />
    </form>
  );
}

function formValue(name: string) {
  return new FormData(screen.getByRole<HTMLFormElement>('form')).get(name);
}

describe('MaskedTextField', () => {
  it('UIC-MASKED-TEXT-FIELD-1.1 is a text field with a mask placeholder and a numeric keyboard', () => {
    const { container } = render(<Phone />);
    const root = container.querySelector('.ui-field');
    expect(root).toHaveClass('ui-text-field', 'ui-masked-text-field');
    expect(textbox()).toHaveAttribute('placeholder', '(___) ___-____');
    expect(textbox()).toHaveAttribute('inputmode', 'numeric');
    expectHooksMatchSpec(container, 'MASKED-TEXT-FIELD');
  });

  it('UIC-MASKED-TEXT-FIELD-1.2 UIC-MASKED-TEXT-FIELD-1.3 keeps raw characters apart from the formatted text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(<Phone onChange={onChange} onCommit={onCommit} />);
    await user.type(textbox(), '555a1234');
    expect(textbox()).toHaveValue('(555) 123-4');
    expect(onChange).toHaveBeenLastCalledWith('5551234');
    expect(container.querySelector('.ui-field')).not.toHaveAttribute('data-complete');
    await user.type(textbox(), '567{Enter}');
    expect(textbox()).toHaveValue('(555) 123-4567');
    expect(onCommit).toHaveBeenLastCalledWith('5551234567');
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-complete', 'true');
    expect(formValue('phone')).toBe('5551234567');
  });

  it('UIC-MASKED-TEXT-FIELD-1.4 submits the formatted text on request', async () => {
    const user = userEvent.setup();
    render(<Phone formValue="formatted" defaultValue="5551234567" />);
    expect(formValue('phone')).toBe('(555) 123-4567');
    await user.clear(textbox());
    expect(formValue('phone')).toBe('');
  });

  it('UIC-MASKED-TEXT-FIELD-1.3 reports a partial value and accepts an empty one', async () => {
    const user = userEvent.setup();
    render(<Phone />);
    await user.type(textbox(), '555{Enter}');
    expect(textbox()).toHaveAttribute('aria-invalid', 'true');
    expect(textbox()).toHaveAccessibleErrorMessage('Enter the complete value.');
    await user.clear(textbox());
    await user.keyboard('{Enter}');
    expect(textbox()).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-MASKED-TEXT-FIELD-2.1 keeps the caret after the same accepted characters when typing mid-value', async () => {
    const user = userEvent.setup();
    render(<Phone defaultValue="5551234567" />);
    const input = textbox();
    await user.click(input);
    input.setSelectionRange(6, 6);
    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('(551) 234-567');
    expect(input.selectionStart).toBe(3);
    await user.keyboard('9');
    expect(input).toHaveValue('(559) 123-4567');
    expect(input.selectionStart).toBe(4);
  });

  it('UIC-MASKED-TEXT-FIELD-2.2 deletes forward across a literal and replaces a selection', async () => {
    const user = userEvent.setup();
    render(<Phone defaultValue="5551234567" />);
    const input = textbox();
    await user.click(input);
    input.setSelectionRange(4, 4);
    await user.keyboard('{Delete}');
    expect(input).toHaveValue('(555) 234-567');
    expect(input.selectionStart).toBe(4);
    input.setSelectionRange(1, 4);
    await user.keyboard('8');
    expect(input).toHaveValue('(823) 456-7');
  });

  it('UIC-MASKED-TEXT-FIELD-2.3 reads a pasted formatted value and a controlled replacement', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <MaskedTextField label="Reference" mask="AAA-9999" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue('xyz9876')}>
            Fill
          </button>
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    const input = textbox('Reference');
    expect(input).not.toHaveAttribute('inputmode');
    await user.click(input);
    await user.paste('ab-c 12 34');
    expect(input).toHaveValue('ABC-1234');
    expect(screen.getByRole('status')).toHaveTextContent('ABC1234');
    await user.click(screen.getByRole('button', { name: 'Fill' }));
    expect(input).toHaveValue('XYZ-9876');
    expect(screen.getByRole('status')).toHaveTextContent('xyz9876');
  });

  it('UIC-MASKED-TEXT-FIELD-2.4 undoes and reverts to the committed value', async () => {
    const user = userEvent.setup();
    render(<Phone defaultValue="5551234567" />);
    const input = textbox();
    await user.click(input);
    await user.keyboard('{End}{Backspace}{Backspace}');
    expect(input).toHaveValue('(555) 123-45');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('(555) 123-4567');
    await user.keyboard('{End}{Backspace}');
    await user.keyboard('{Control>}z{/Control}');
    expect(input).toHaveValue('(555) 123-4567');
  });

  it('UIC-MASKED-TEXT-FIELD-2.4 refuses edits while read-only and submits nothing while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Phone defaultValue="5551234567" isReadOnly onChange={onChange} />);
    await user.click(textbox());
    await user.keyboard('{Backspace}1');
    expect(textbox()).toHaveValue('(555) 123-4567');
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Phone defaultValue="5551234567" isDisabled />);
    expect(textbox()).toBeDisabled();
    expect(formValue('phone')).toBeNull();
  });
});
