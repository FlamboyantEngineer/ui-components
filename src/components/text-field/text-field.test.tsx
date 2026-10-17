import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { TextField, type TextFieldProps } from './text-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

/** A field whose committed value is the caller's, as when a form saves it. */
function SavedField(props: Omit<TextFieldProps, 'label'>) {
  const [saved, setSaved] = useState('Apple');
  return (
    <>
      <TextField label="Fruit" committedValue={saved} onCommit={setSaved} {...props} />
      <output>{saved}</output>
    </>
  );
}

describe('TextField', () => {
  it('UIC-TEXT-FIELD-1.1 is a field around a React Aria text field that starts empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<TextField label="Fruit" onChange={onChange} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-text-field');
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toHaveValue('');
    await user.type(input, 'Fig');
    expect(onChange).toHaveBeenLastCalledWith('Fig');
    expect(input).toHaveValue('Fig');
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['box', 'input'] });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-TEXT-FIELD-1.2 edits several lines in a text area and passes React Aria props on', async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    const { container, unmount } = render(
      <TextField
        label="Notes"
        multiline
        placeholder="Write a note"
        onFocus={() => events.push('focus')}
      />,
    );
    const area = screen.getByRole('textbox', { name: 'Notes' });
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toHaveClass('ui-text-field__input');
    expect(area).toHaveAttribute('placeholder', 'Write a note');
    expect(root(container)).toHaveAttribute('data-multiline', 'true');
    await user.click(area);
    expect(events).toEqual(['focus']);
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['box', 'input'] });
    unmount();

    const { container: single } = render(
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        spellCheck="false"
        autoFocus
        onKeyDown={(event) => events.push(`key:${event.key}`)}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('inputmode', 'email');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveFocus();
    expect(root(single)).not.toHaveAttribute('data-multiline');
    await user.keyboard('a');
    expect(events).toContain('key:a');
  });

  it('UIC-TEXT-FIELD-1.3 names, describes and locks the control', () => {
    const { rerender } = render(
      <TextField id="fruit" label="Fruit" description="Pick a fruit." isRequired />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-errormessage', 'fruit-message');
    expect(input).toHaveAccessibleDescription('Pick a fruit. A value is required.');
    rerender(<TextField id="fruit" label="Fruit" defaultValue="Fig" isReadOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    rerender(<TextField id="fruit" label="Fruit" defaultValue="Fig" isDisabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('UIC-TEXT-FIELD-1.4 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <TextField id="fruit" label="Fruit" className="wide" data-test="fruit" />,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-text-field', 'wide');
    expect(root(container)).toHaveAttribute('data-test', 'fruit');
    expect(root(container)).toHaveAttribute('id', 'fruit');
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'fruit-control');
    expectHooksMatchSpec(container, 'TEXT-FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-TEXT-FIELD-2.1 commits on blur and Enter, once per value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TextField label="Fruit" defaultValue="Fig" onCommit={onCommit} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 's');
    await user.keyboard('{Enter}{Enter}');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith('Figs');
    await user.tab();
    expect(onCommit).toHaveBeenCalledTimes(1);
    await user.type(input, '!');
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('Figs!');
    fireEvent.change(input, { target: { value: 'Kiwi' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('UIC-TEXT-FIELD-2.1 keeps Enter as a line break in a multiline field and commits on blur', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TextField label="Notes" multiline onCommit={onCommit} />);
    await user.type(screen.getByRole('textbox'), 'One{Enter}Two');
    expect(onCommit).not.toHaveBeenCalled();
    await user.tab();
    expect(onCommit).toHaveBeenCalledWith('One\nTwo');
  });

  it('UIC-TEXT-FIELD-2.2 reverts an edit on Escape without letting the key out', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={(event) => outer(event.key)}>
        <TextField label="Fruit" defaultValue="Fig" />
      </div>,
    );
    const input = screen.getByRole('textbox');
    await user.type(input, 's');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('Fig');
    expect(input).toHaveFocus();
    expect(outer).not.toHaveBeenCalledWith('Escape');
    await user.keyboard('{Escape}');
    expect(outer).toHaveBeenCalledWith('Escape');
  });

  it('UIC-TEXT-FIELD-2.3 checks length and format without blocking typing', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TextField
        label="Code"
        minLength={2}
        maxLength={4}
        pattern={/[A-Z]+/}
        trim
        validate={() => ({ severity: 'warning', message: 'Check the code.' })}
      />,
    );
    const input = screen.getByRole('textbox');
    const message = () => container.querySelector('.ui-field__message')?.textContent;
    await user.type(input, 'A');
    expect(message()).toBe('Use at least 2 characters.');
    await user.type(input, 'BCDE');
    expect(input).toHaveValue('ABCDE');
    expect(message()).toBe('Use 4 characters or fewer.');
    await user.clear(input);
    await user.type(input, ' ab ');
    expect(message()).toBe('Enter a value in the expected format.');
    await user.clear(input);
    await user.type(input, ' AB ');
    expect(message()).toBe('Check the code.');
  });

  it('UIC-TEXT-FIELD-2.4 shows warnings and pending checks', () => {
    const { container, rerender } = render(
      <TextField
        label="Fruit"
        defaultValue="Lime"
        validate={(value) =>
          value === 'Lime' ? { severity: 'warning', message: 'Limes are sour.' } : null
        }
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    expect(screen.getByText('Limes are sour.')).toBeInTheDocument();
    rerender(<TextField label="Fruit" defaultValue="Lime" isPending />);
    expect(root(container)).toHaveAttribute('data-validation', 'pending');
    expect(screen.getByText('Validating')).toBeInTheDocument();
  });

  it('UIC-TEXT-FIELD-2.4 shows dirty state, restores, undoes and redoes', async () => {
    const user = userEvent.setup();
    const { container } = render(<SavedField />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 's');
    await user.tab();
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('Apples');
    expect(root(container)).not.toHaveAttribute('data-dirty');
    await user.click(input);
    await user.type(input, '!');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Fruit' }));
    expect(input).toHaveValue('Apples');
    expect(input).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(input).toHaveValue('Apples!');
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(input).toHaveValue('Apples');
  });

  it('UIC-TEXT-FIELD-2.4 clears and sets the default from the field menu', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <TextField
        label="Fruit"
        defaultValue="Apple"
        committedValue="Pear"
        menu={['clear', 'set-default']}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(input).toHaveValue('');
    expect(onCommit).toHaveBeenLastCalledWith('');
    await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Set to default' }));
    expect(input).toHaveValue('Apple');
    expect(onCommit).toHaveBeenLastCalledWith('Apple');
  });
});
