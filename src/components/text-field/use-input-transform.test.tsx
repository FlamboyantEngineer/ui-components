import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { TextField } from './text-field.js';

const toHexDigits = (text: string) => text.replace(/[^0-9a-f]/gi, '').toUpperCase();

function caretOf(input: HTMLElement) {
  return (input as HTMLInputElement).selectionStart;
}

describe('TextField input transform', () => {
  it('UIC-TEXT-FIELD-4.1 filters and rewrites typed text before it becomes the value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <TextField label="Colour code" transformInput={toHexDigits} onChange={onChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'Colour code' });
    await user.type(input, 'a1-zb');
    expect(input).toHaveValue('A1B');
    expect(onChange.mock.calls.map(([value]) => value)).toEqual(['A', 'A1', 'A1B']);
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['box', 'input'] });
  });

  it('UIC-TEXT-FIELD-4.1 keeps the caret after the same accepted characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TextField
        label="Colour code"
        defaultValue="ABCD"
        transformInput={toHexDigits}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Colour code' });
    await user.type(input, 'x', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    // An edit the transform reduces to the current value changes nothing.
    expect(input).toHaveValue('ABCD');
    expect(onChange).not.toHaveBeenCalled();
    expect(caretOf(input)).toBe(2);
    await user.keyboard('e');
    expect(input).toHaveValue('ABECD');
    expect(caretOf(input)).toBe(3);
    await user.paste('f-0 9');
    expect(input).toHaveValue('ABEF09CD');
    expect(caretOf(input)).toBe(6);
  });

  it('UIC-TEXT-FIELD-4.1 transforms a composition once it ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TextField label="Code" transformInput={(text) => text.toUpperCase()} onChange={onChange} />,
    );
    const input = screen.getByRole('textbox', { name: 'Code' });
    act(() => input.focus());
    fireEvent.compositionStart(input);
    await user.keyboard('ka');
    expect(input).toHaveValue('ka');
    fireEvent.compositionEnd(input);
    expect(input).toHaveValue('KA');
    expect(onChange).toHaveBeenLastCalledWith('KA');
  });

  it('UIC-TEXT-FIELD-4.1 leaves values set outside an edit as they are', async () => {
    const user = userEvent.setup();
    render(<TextField label="Code" defaultValue="mixed" transformInput={toHexDigits} />);
    const input = screen.getByRole('textbox', { name: 'Code' });
    expect(input).toHaveValue('mixed');
    await user.type(input, 'c');
    expect(input).toHaveValue('EDC');
  });
});

describe('TextField display value', () => {
  it('UIC-TEXT-FIELD-4.2 shows the display value at rest and the value while focused', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <TextField
        label="Quantity"
        defaultValue="2 * 3"
        displayValue="6"
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const field = container.querySelector('.ui-text-field');
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input).toHaveValue('6');
    expect(field).toHaveAttribute('data-display-value', 'true');
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['box', 'input'] });

    await user.click(input);
    expect(input).toHaveValue('2 * 3');
    expect(field).not.toHaveAttribute('data-display-value');
    await user.tab();
    expect(input).toHaveValue('6');
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
    expect(field).not.toHaveAttribute('data-dirty');

    await user.click(input);
    await user.type(input, ' + 1');
    expect(input).toHaveValue('2 * 3 + 1');
    // Tab reaches the restore button; the display value shows, and leaving the field commits.
    await user.tab();
    expect(input).toHaveValue('6');
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('2 * 3 + 1');
    expect(input).toHaveValue('6');
  });

  it('UIC-TEXT-FIELD-4.2 submits the value, not the display value', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Order">
        <TextField label="Quantity" name="quantity" defaultValue="3" displayValue="three units" />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Order' });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input).toHaveValue('three units');
    expect(input).not.toHaveAttribute('name');
    expect(new FormData(form).getAll('quantity')).toEqual(['3']);
    await user.click(input);
    await user.type(input, '0');
    expect(new FormData(form).getAll('quantity')).toEqual(['30']);
  });

  it('UIC-TEXT-FIELD-4.2 shows a multiline display value in the text area', async () => {
    const user = userEvent.setup();
    render(
      <TextField label="Recipe" multiline defaultValue="flour, water" displayValue="2 items" />,
    );
    const area = screen.getByRole('textbox', { name: 'Recipe' });
    expect(area).toHaveValue('2 items');
    await user.click(area);
    expect(area).toHaveValue('flour, water');
  });
});
