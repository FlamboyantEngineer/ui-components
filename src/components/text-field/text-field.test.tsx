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
  it('UIC-TEXT-FIELD-1.1 is a field around a text field that starts empty', async () => {
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

  it('UIC-TEXT-FIELD-1.2 UIC-FIELD-8.3 edits several lines in a text area and passes its input props on', async () => {
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
        spellCheck={false}
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
    expect(input).toBeRequired();
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
    // Tab reaches the restore button inside the field; leaving the field commits.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Fruit' })).toHaveFocus();
    expect(onCommit).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('Figs!');
    await user.clear(input);
    await user.type(input, 'Kiwi');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
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

  it('UIC-TEXT-FIELD-3.1 frames adornments with the input', () => {
    const { container, rerender } = render(
      <TextField
        label="Price"
        startAdornment="€"
        endAdornment={<button type="button">Convert</button>}
      />,
    );
    const group = container.querySelector('.ui-text-field__group');
    expect(group).toHaveAttribute('role', 'presentation');
    expect([...(group?.children ?? [])].map((node) => node.className.split(' ')[0])).toEqual([
      'ui-text-field__start',
      'ui-text-field__input',
      'ui-text-field__end',
    ]);
    expect(container.querySelector('.ui-text-field__start')).toHaveTextContent('€');
    expect(screen.getByRole('button', { name: 'Convert' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Price' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['box', 'group', 'start', 'end'] });
    rerender(<TextField label="Price" />);
    expect(container.querySelector('.ui-text-field__group')).toBeNull();
  });

  it('UIC-TEXT-FIELD-3.2 reveals a masked value from a toggle button', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <TextField label="Password" type="password" allowsReveal defaultValue="s3cret" />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    const reveal = screen.getByRole('button', { name: 'Show Password' });
    expect(input).toHaveAttribute('type', 'password');
    expect(reveal).toHaveAttribute('aria-pressed', 'false');
    expect(reveal).toHaveClass('ui-text-field__reveal', 'ui-button');
    expect(reveal.querySelector('[data-glyph="eye"]')).not.toBeNull();
    await user.click(input);
    await user.click(reveal);
    expect(input).toHaveAttribute('type', 'text');
    expect(reveal).toHaveAttribute('aria-pressed', 'true');
    expect(reveal.querySelector('[data-glyph="eye-slash"]')).not.toBeNull();
    expect(input).toHaveFocus();
    await user.tab();
    expect(reveal).toHaveFocus();
    await user.keyboard(' ');
    expect(input).toHaveAttribute('type', 'password');
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['group', 'reveal'] });
    rerender(<TextField label="Password" type="password" allowsReveal isDisabled />);
    expect(screen.getByRole('button', { name: 'Show Password' })).toBeDisabled();
    rerender(<TextField label="Password" type="password" />);
    expect(screen.queryByRole('button', { name: 'Show Password' })).not.toBeInTheDocument();
    rerender(<TextField label="Password" allowsReveal />);
    expect(screen.queryByRole('button', { name: 'Show Password' })).not.toBeInTheDocument();
  });

  it('UIC-TEXT-FIELD-3.3 grows a text area with its text between its row limits', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <TextField label="Notes" multiline minRows={2} maxRows={4} />,
    );
    const area = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Notes' });
    expect(area).toHaveAttribute('rows', '2');
    expect(root(container)).toHaveAttribute('data-autosize', 'true');
    area.style.lineHeight = '20px';
    area.style.padding = '0px';
    Object.defineProperty(area, 'scrollHeight', {
      configurable: true,
      get: () => area.value.split('\n').length * 20,
    });
    await user.type(area, 'One');
    expect(area.style.height).toBe('40px');
    await user.type(area, '{Enter}Two{Enter}Three');
    expect(area.style.height).toBe('60px');
    await user.type(area, '{Enter}Four{Enter}Five{Enter}Six');
    expect(area.style.height).toBe('80px');
    expectHooksMatchSpec(container, 'TEXT-FIELD');
    rerender(<TextField label="Notes" multiline />);
    expect(root(container)).not.toHaveAttribute('data-autosize');
  });

  it('UIC-TEXT-FIELD-3.4 counts trimmed text with trim, as the length rules do', () => {
    const { container } = render(
      <TextField label="Code" defaultValue="abc   " maxLength={4} trim showCount />,
    );
    const count = container.querySelector('.ui-text-field__count');
    expect(count).toHaveTextContent('3/4');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-TEXT-FIELD-3.4 counts the text in the description, as the length rules count it', async () => {
    const user = userEvent.setup();
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const { container, rerender } = render(
      <TextField label="Status" description="Shown to everyone." maxLength={10} showCount />,
    );
    const input = screen.getByRole('textbox', { name: 'Status' });
    const count = container.querySelector('.ui-field__description .ui-text-field__count');
    expect(count).toHaveTextContent('0/10');
    await user.type(input, 'Away');
    expect(count).toHaveTextContent('4/10');
    expect(input).toHaveAccessibleDescription('Shown to everyone. 4/10');
    expectHooksMatchSpec(container, 'TEXT-FIELD', { slots: ['count'] });
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    rerender(
      <TextField
        label="Status"
        value={family}
        maxLength={1}
        showCount
        getLength={(text) => [...segmenter.segment(text)].length}
      />,
    );
    expect(container.querySelector('.ui-text-field__count')).toHaveTextContent('1/1');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
    rerender(<TextField label="Status" value="Away" showCount />);
    expect(container.querySelector('.ui-text-field__count')).toHaveTextContent('4');
  });
});
