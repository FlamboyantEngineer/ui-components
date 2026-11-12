import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { I18nProvider } from '../../primitives/index.js';
import { Form } from '../form/form.js';
import { TextField } from '../text-field/text-field.js';
import { TagsInput, type TagsInputProps } from './tags-input.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function tagTexts() {
  return screen.queryAllByRole('row').map((row) => row.textContent);
}

function message(container: HTMLElement) {
  return container.querySelector('.ui-field__message')?.textContent;
}

/** A field whose committed value is the caller's, as when a form saves it. */
function SavedField(props: Omit<TagsInputProps, 'label'>) {
  const [saved, setSaved] = useState(['Apple']);
  return (
    <>
      <TagsInput label="Fruit" committedValue={saved} onCommit={setSaved} {...props} />
      <output>{saved.join(', ')}</output>
    </>
  );
}

describe('TagsInput', () => {
  it('UIC-TAGS-INPUT-1.1 is a field around tags and an input that starts empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <TagsInput label="Fruit" onChange={onChange} onCommit={onCommit} />,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-tags-input');
    expect(container.querySelector('.ui-tags-input__tags')).toBeNull();
    expectHooksMatchSpec(container, 'TAGS-INPUT', { slots: ['group', 'input'] });
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 'Fig{Enter}Kiwi{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['Fig', 'Kiwi']);
    expect(onCommit).toHaveBeenLastCalledWith(['Fig', 'Kiwi']);
    expect(tagTexts()).toEqual(['Fig', 'Kiwi']);
    expect(input).toHaveValue('');
    const group = container.querySelector('.ui-tags-input__group');
    expect(group).toHaveAttribute('role', 'presentation');
    // React Aria builds the tag collection in a <template> beside it.
    const parts = [...(group?.children ?? [])].filter((node) => node.localName !== 'template');
    expect(parts.map((node) => node.className)).toEqual([
      'ui-tag-group ui-tags-input__tags',
      'ui-tags-input__input',
    ]);
    expectHooksMatchSpec(container, 'TAGS-INPUT', { slots: ['group', 'tags', 'input'] });
    expectHooksMatchSpec(container, 'TAG-GROUP', { slots: ['list', 'tag', 'label', 'remove'] });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control', 'message'] });
  });

  it('UIC-TAGS-INPUT-1.2 submits each tag under its name, and nothing while disabled', async () => {
    const user = userEvent.setup();
    let submitted: FormDataEntryValue[] = [];
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitted = new FormData(event.currentTarget).getAll('fruit');
    };
    const { rerender } = render(
      <Form aria-label="Order" onSubmit={onSubmit}>
        <TagsInput label="Fruit" name="fruit" defaultValue={['Apple', 'Apple']} allowsDuplicates />
        <button type="submit">Order</button>
      </Form>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Fruit' }), 'Fig{Enter}Kiwi');
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual(['Apple', 'Apple', 'Fig']);
    rerender(
      <Form aria-label="Order" onSubmit={onSubmit}>
        <TagsInput label="Fruit" name="fruit" defaultValue={['Apple']} isDisabled />
        <button type="submit">Order</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Order' }));
    expect(submitted).toEqual([]);
  });

  it('UIC-TAGS-INPUT-1.2 UIC-FIELD-2.6 puts the first tags back on a native form reset', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Order">
        <TagsInput label="Fruit" name="fruit" defaultValue={['Apple']} />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Order' });
    await user.type(screen.getByRole('textbox', { name: 'Fruit' }), 'Fig{Enter}');
    expect(new FormData(form).getAll('fruit')).toEqual(['Apple', 'Fig']);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(new FormData(form).getAll('fruit')).toEqual(['Apple']));
    expect(tagTexts()).toEqual(['Apple']);
  });

  it('UIC-TAGS-INPUT-1.2 UIC-FIELD-2.6 keeps edits when a listener cancels the reset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    let isConfirmed = false;
    render(
      <form
        aria-label="Order"
        onReset={(event) => {
          if (!isConfirmed) event.preventDefault();
        }}
      >
        <TagsInput label="Fruit" name="fruit" defaultValue={['Apple']} onChange={onChange} />
        <TextField label="Note" name="note" defaultValue="Ripe" />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Order' });
    const note = screen.getByRole('textbox', { name: 'Note' });
    await user.type(screen.getByRole('textbox', { name: 'Fruit' }), 'Fig{Enter}');
    await user.type(note, ' only');
    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(new FormData(form).getAll('fruit')).toEqual(['Apple', 'Fig']);
    expect(note).toHaveValue('Ripe only');
    expect(onChange).not.toHaveBeenCalled();

    isConfirmed = true;
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(new FormData(form).getAll('fruit')).toEqual(['Apple']));
    expect(note).toHaveValue('Ripe');
    expect(tagTexts()).toEqual(['Apple']);
  });

  it('UIC-TAGS-INPUT-1.3 names the tags from the field label when no label is drawn', () => {
    render(<TagsInput label="Fruit" labelLayout="control-only" defaultValue={['Fig']} />);
    expect(screen.getByRole('textbox', { name: 'Fruit' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Fruit selected values' })).toBeInTheDocument();
  });

  it('UIC-TAGS-INPUT-1.3 names and describes the input and names the tags', () => {
    const { container, rerender } = render(
      <TagsInput id="fruit" label="Fruit" description="Type and press Enter." isRequired />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-errormessage', 'fruit-message');
    expect(input).toHaveAccessibleDescription('Type and press Enter. A value is required.');
    expect(container.querySelector('.ui-tags-input__group')).toHaveAttribute(
      'data-invalid',
      'true',
    );
    rerender(<TagsInput id="fruit" label="Fruit" value={['Fig']} isReadOnly />);
    expect(screen.getByRole('grid', { name: 'Fruit selected values' })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    expect(container.querySelector('.ui-tags-input__group')).toHaveAttribute(
      'data-readonly',
      'true',
    );
    rerender(<TagsInput id="fruit" label="Fruit" value={['Fig']} isDisabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(container.querySelector('.ui-tags-input__group')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expectHooksMatchSpec(container, 'TAGS-INPUT', { slots: ['group', 'tags', 'input'] });
  });

  it('UIC-TAGS-INPUT-1.4 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <TagsInput id="fruit" label="Fruit" className="wide" data-test="fruit" />,
    );
    expect(root(container)).toHaveClass('ui-field', 'ui-tags-input', 'wide');
    expect(root(container)).toHaveAttribute('data-test', 'fruit');
    expect(root(container)).toHaveAttribute('id', 'fruit');
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'fruit-control');
    expectHooksMatchSpec(container, 'TAGS-INPUT', { callerAttributes: ['data-test'] });
  });

  it('UIC-TAGS-INPUT-2.1 adds tags on Enter and on each delimiter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <TagsInput label="Fruit" delimiters={[',', ';']} />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, ' Fig {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(input, 'Kiwi,, Lime; Ma');
    expect(tagTexts()).toEqual(['Fig', 'Kiwi', 'Lime']);
    expect(input).toHaveValue(' Ma');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set a key code on a keydown
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(tagTexts()).toHaveLength(3);
    await user.clear(input);
    await user.type(input, '  {Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(tagTexts()).toHaveLength(3);
  });

  it('UIC-TAGS-INPUT-2.1 keeps composed text whole until the composition ends, then splits it once', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TagsInput label="Fruit" onCommit={onCommit} />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });

    fireEvent.compositionStart(input);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot compose with an input method
    fireEvent.input(input, { target: { value: 'alpha,' }, isComposing: true });
    expect(input).toHaveValue('alpha,');
    expect(tagTexts()).toEqual([]);
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { data: 'alpha,' });
    expect(tagTexts()).toEqual(['alpha']);
    expect(input).toHaveValue('');
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(['alpha']);
    // A cancelled composition leaves its text as typed, and ordinary typing goes on.
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot compose with an input method
    fireEvent.input(input, { target: { value: 'bl' }, isComposing: true });

    fireEvent.compositionEnd(input, { data: '' });
    expect(input).toHaveValue('bl');
    await user.type(input, 'ue,');
    expect(tagTexts()).toEqual(['alpha', 'blue']);
  });

  it('UIC-TAGS-INPUT-1.1 commits the tags a caller changes', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    function Lower() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <TagsInput
          label="Fruit"
          value={value}
          onChange={(next) => setValue(next.map((tag) => tag.toLowerCase()))}
          onCommit={onCommit}
        />
      );
    }
    const { container } = render(<Lower />);
    await user.type(screen.getByRole('textbox', { name: 'Fruit' }), 'Ab{Enter}');
    expect(tagTexts()).toEqual(['ab']);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(['ab']);
    expect(root(container)).not.toHaveAttribute('data-dirty');
  });

  it('UIC-TAGS-INPUT-2.2 splits a pasted list and pastes plain text as typed', async () => {
    const user = userEvent.setup();
    render(<TagsInput label="Fruit" />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Fruit' });
    await user.type(input, 'Fi');
    await user.paste('g, Kiwi\nLime\r\nMango');
    expect(tagTexts()).toEqual(['Fig', 'Kiwi', 'Lime', 'Mango']);
    expect(input).toHaveValue('');
    await user.paste('Plum');
    expect(input).toHaveValue('Plum');
    expect(tagTexts()).toHaveLength(4);
    input.setSelectionRange(0, 2);
    await user.paste('Ap,Pl');
    expect(tagTexts()).toEqual(['Fig', 'Kiwi', 'Lime', 'Mango', 'Ap', 'Plum']);
  });

  it('UIC-TAGS-INPUT-2.3 takes controlled text and reports every change of it', async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    function Controlled() {
      const [text, setText] = useState('Fi');
      return (
        <TagsInput
          label="Fruit"
          placeholder="Add a fruit"
          inputValue={text}
          onInputChange={(next) => {
            changes.push(next);
            setText(next);
          }}
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    expect(input).toHaveValue('Fi');
    expect(input).toHaveAttribute('placeholder', 'Add a fruit');
    await user.type(input, 'g,K');
    expect(changes).toEqual(['Fig', '', 'K']);
    expect(tagTexts()).toEqual(['Fig']);
    await user.keyboard('{Enter}');
    expect(changes.at(-1)).toBe('');
    expect(tagTexts()).toEqual(['Fig', 'K']);
  });

  it('UIC-TAGS-INPUT-2.4 adds the typed text when focus leaves the input, with addOnBlur', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TagsInput label="Fruit" defaultValue={['Apple']} addOnBlur />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 'Fig');
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveFocus();
    expect(tagTexts()).toEqual(['Apple']);
    await user.click(input);
    await user.tab();
    expect(tagTexts()).toEqual(['Apple', 'Fig']);
    expect(input).toHaveValue('');
    rerender(<TagsInput label="Fruit" defaultValue={['Apple']} />);
    await user.type(input, 'Kiwi');
    await user.tab();
    expect(input).toHaveValue('Kiwi');
  });

  it('UIC-TAGS-INPUT-3.1 UIC-TAGS-INPUT-3.3 keeps a duplicate in the input and shows why', async () => {
    const user = userEvent.setup();
    const { container } = render(<TagsInput label="Fruit" defaultValue={['Apple', 'Pear']} />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 'Apple{Enter}');
    expect(tagTexts()).toEqual(['Apple', 'Pear']);
    expect(input).toHaveValue('Apple');
    expect(message(container)).toBe('“Apple” is already added.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.type(input, 's');
    expect(message(container)).toBe('');
    await user.keyboard('{Backspace}{Enter}');
    expect(message(container)).toBe('“Apple” is already added.');
    await user.click(screen.getAllByRole('button', { name: /^Remove/ })[0] as HTMLElement);
    expect(tagTexts()).toEqual(['Pear']);
    expect(message(container)).toBe('');
    await user.keyboard('{Enter}');
    expect(tagTexts()).toEqual(['Pear', 'Apple']);
  });

  it('UIC-TAGS-INPUT-3.1 shows a refusal whatever the mode and over the required message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container } = render(
      <Form aria-label="Invite" validationBehavior="aria" onSubmit={onSubmit}>
        <TagsInput
          label="Guests"
          isRequired
          validateTag={(tag) => (tag.includes('@') ? null : 'Enter an address.')}
        />
        <button type="submit">Send</button>
      </Form>,
    );
    const input = screen.getByRole('textbox', { name: 'Guests' });
    expect(message(container)).toBe('');
    await user.type(input, 'ada{Enter}');
    expect(message(container)).toBe('Enter an address.');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    await user.clear(input);
    expect(message(container)).toBe('A value is required.');
    await user.type(input, 'ada@example.com{Enter}');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-TAGS-INPUT-3.2 refuses tags past the maximum and keeps a set value whole', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <TagsInput label="Fruit" defaultValue={['Apple']} maxValues={3} />,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.click(input);
    await user.paste('Fig,Kiwi,Lime,Mango');
    expect(tagTexts()).toEqual(['Apple', 'Fig', 'Kiwi']);
    expect(input).toHaveValue('Lime,Mango');
    expect(message(container)).toBe('Add up to 3 values.');
    rerender(<TagsInput label="Fruit" value={['A', 'B', 'C', 'D']} maxValues={3} />);
    expect(tagTexts()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('UIC-TAGS-INPUT-1.1 counts only tags with text toward a value', () => {
    const { container, rerender } = render(
      <TagsInput label="Fruit" value={['', ' ']} isRequired />,
    );
    expect(root(container)).not.toHaveAttribute('data-filled');
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    rerender(<TagsInput label="Fruit" value={['', 'Fig']} isRequired />);
    expect(root(container)).toHaveAttribute('data-filled', 'true');
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-TAGS-INPUT-3.3 flags a given value that repeats a tag', () => {
    const { container, rerender } = render(
      <TagsInput label="Fruit" value={['Fig', 'Kiwi', 'Fig']} validationMode="immediate" />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(message(container)).toBe('“Fig” is already added.');
    rerender(<TagsInput label="Fruit" value={['Fig', 'Kiwi', 'Fig']} allowsDuplicates />);
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-TAGS-INPUT-3.3 accepts duplicates as separate tags when allowed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagsInput label="Fruit" defaultValue={['Fig']} allowsDuplicates onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 'Fig{Enter}Fig{Enter}');
    expect(tagTexts()).toEqual(['Fig', 'Fig', 'Fig']);
    await user.click(screen.getAllByRole('button', { name: /^Remove/ })[1] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith(['Fig', 'Fig']);
  });

  it('UIC-TAGS-INPUT-3.4 refuses a tag the caller rejects with its message', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TagsInput
        label="Guests"
        validateTag={(tag) => (tag.includes('@') ? null : 'Enter an address.')}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Guests' });
    await user.type(input, 'ada@example.com,lin,');
    expect(tagTexts()).toEqual(['ada@example.com']);
    expect(input).toHaveValue('lin');
    expect(message(container)).toBe('Enter an address.');
    await user.clear(input);
    await user.paste('sam@example.com,kim,lee@example.com');
    expect(tagTexts()).toEqual(['ada@example.com', 'sam@example.com', 'lee@example.com']);
    expect(input).toHaveValue('kim');
    expect(message(container)).toBe('Enter an address.');
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
  });

  it('UIC-TAGS-INPUT-4.1 moves between the input and the tags with Backspace and the arrows', async () => {
    const user = userEvent.setup();
    render(<TagsInput label="Fruit" defaultValue={['Apple', 'Pear']} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Fruit' });
    await user.click(input);
    await user.keyboard('{Backspace}');
    expect(screen.getByRole('row', { name: 'Pear' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(input).toHaveFocus();
    await user.type(input, 'Fig');
    await user.keyboard('{ArrowLeft}');
    expect(input).toHaveFocus();
    input.setSelectionRange(0, 0);
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('row', { name: 'Pear' })).toHaveFocus();
    expect(tagTexts()).toEqual(['Apple', 'Pear']);
  });

  it('UIC-TAGS-INPUT-4.1 mirrors the arrow keys in a right-to-left locale', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-EG">
        <TagsInput label="Fruit" defaultValue={['Apple', 'Pear']} />
      </I18nProvider>,
    );
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.click(input);
    await user.keyboard('{ArrowLeft}');
    expect(input).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('row', { name: 'Pear' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(input).toHaveFocus();
  });

  it('UIC-TAGS-INPUT-4.2 removes tags and returns focus to the input', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<TagsInput label="Fruit" defaultValue={['Apple', 'Pear', 'Fig']} onCommit={onCommit} />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.click(input);
    await user.keyboard('{Backspace}{Backspace}');
    expect(tagTexts()).toEqual(['Apple', 'Pear']);
    expect(onCommit).toHaveBeenLastCalledWith(['Apple', 'Pear']);
    expect(input).toHaveFocus();
    await user.keyboard('{Backspace}{ArrowLeft}{Delete}');
    expect(tagTexts()).toEqual(['Pear']);
    expect(input).toHaveFocus();
    await user.click(screen.getByRole('button', { name: /^Remove/ }));
    expect(tagTexts()).toEqual([]);
    expect(input).toHaveFocus();
  });

  it('UIC-TAGS-INPUT-4.2 keeps read-only tags navigable and disables tags of a disabled field', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TagsInput label="Fruit" defaultValue={['Apple', 'Pear']} isReadOnly />,
    );
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('textbox', { name: 'Fruit' }));
    await user.keyboard('{Backspace}{Delete}');
    expect(screen.getByRole('row', { name: 'Pear' })).toHaveFocus();
    expect(tagTexts()).toEqual(['Apple', 'Pear']);
    rerender(<TagsInput label="Fruit" defaultValue={['Apple', 'Pear']} isDisabled />);
    for (const row of screen.getAllByRole('row')) {
      expect(row).toHaveAttribute('data-disabled', 'true');
    }
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
  });

  it('UIC-TAGS-INPUT-4.3 focuses the input from a press on the frame', async () => {
    const user = userEvent.setup();
    const { container } = render(<TagsInput label="Fruit" defaultValue={['Apple']} />);
    await user.click(container.querySelector('.ui-tags-input__group') as HTMLElement);
    expect(screen.getByRole('textbox', { name: 'Fruit' })).toHaveFocus();
    await user.click(screen.getByRole('row', { name: 'Apple' }));
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveFocus();
  });

  it('UIC-TAGS-INPUT-4.4 shows dirty state, restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    const { container } = render(<SavedField />);
    const input = screen.getByRole('textbox', { name: 'Fruit' });
    await user.type(input, 'Fig{Enter}');
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('Apple, Fig');
    expect(root(container)).not.toHaveAttribute('data-dirty');
    await user.keyboard('{Control>}z{/Control}');
    expect(tagTexts()).toEqual(['Apple']);
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(tagTexts()).toEqual(['Apple', 'Fig']);
    await chooseFieldMenuItem(user, input, 'Clear');
    expect(tagTexts()).toEqual([]);
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('');
  });

  it('UIC-TAGS-INPUT-4.4 shows dirty state against a committed value the caller holds', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TagsInput
        showRestoreButton
        label="Fruit"
        committedValue={['Apple']}
        defaultValue={['Apple']}
      />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Fruit' }), 'Fig{Enter}');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Fruit' }));
    expect(tagTexts()).toEqual(['Apple']);
    expect(screen.getByRole('textbox', { name: 'Fruit' })).toHaveFocus();
  });

  describe('editing a tag', () => {
    function EditableField(props: Partial<TagsInputProps>) {
      return (
        <TagsInput label="Fruit" defaultValue={['Apple', 'Fig', 'Kiwi']} allowsEditing {...props} />
      );
    }

    it('UIC-TAGS-INPUT-4.5 opens a named editor on Enter and F2 and keeps the tag in place', async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const { container } = render(<EditableField onCommit={onCommit} />);
      await user.click(screen.getByRole('textbox', { name: 'Fruit' }));
      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(screen.getByRole('row', { name: 'Fig' })).toHaveFocus();
      await user.keyboard('{Enter}');
      const editor = screen.getByRole('textbox', { name: 'Edit Fig' });
      expect(editor).toHaveFocus();
      expect(editor).toHaveValue('Fig');
      expect(container.querySelector('.ui-tags-input__group')).toHaveAttribute(
        'data-editing',
        'true',
      );
      expectHooksMatchSpec(container, 'TAGS-INPUT', { slots: ['editor'] });
      await user.keyboard('Pear{Enter}');
      expect(tagTexts()).toEqual(['Apple', 'Pear', 'Kiwi']);
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(onCommit).toHaveBeenLastCalledWith(['Apple', 'Pear', 'Kiwi']);
      await waitFor(() => expect(screen.getByRole('row', { name: 'Pear' })).toHaveFocus());
      await user.keyboard('{F2}');
      expect(screen.getByRole('textbox', { name: 'Edit Pear' })).toHaveFocus();
    });

    it('UIC-TAGS-INPUT-4.5 opens on a double click and restores the tag on Escape', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<EditableField onChange={onChange} />);
      await user.dblClick(screen.getByText('Kiwi'));
      const editor = screen.getByRole('textbox', { name: 'Edit Kiwi' });
      await user.clear(editor);
      await user.type(editor, 'Lime');
      await user.keyboard('{Escape}');
      expect(tagTexts()).toEqual(['Apple', 'Fig', 'Kiwi']);
      expect(onChange).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.getByRole('row', { name: 'Kiwi' })).toHaveFocus());
    });

    it('UIC-TAGS-INPUT-4.5 refuses a duplicate edit but not the tag itself, and stays correctable', async () => {
      const user = userEvent.setup();
      const { container } = render(<EditableField />);
      await user.dblClick(screen.getByText('Fig'));
      const editor = screen.getByRole('textbox', { name: 'Edit Fig' });
      await user.clear(editor);
      await user.type(editor, ' Fig {Enter}');
      expect(screen.queryByRole('textbox', { name: 'Edit Fig' })).not.toBeInTheDocument();
      expect(message(container)).toBeFalsy();
      await user.dblClick(screen.getByText('Fig'));
      await user.clear(screen.getByRole('textbox', { name: 'Edit Fig' }));
      await user.type(screen.getByRole('textbox', { name: 'Edit Fig' }), 'Apple{Enter}');
      const refused = screen.getByRole('textbox', { name: 'Edit Fig' });
      expect(refused).toHaveAttribute('aria-invalid', 'true');
      expect(message(container)).toBe('“Apple” is already added.');
      // The edited tag shows its editor, and the value keeps its accepted text.
      expect(tagTexts()).toEqual(['Apple', '', 'Kiwi']);
      expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
      await user.type(refused, 's{Enter}');
      expect(tagTexts()).toEqual(['Apple', 'Apples', 'Kiwi']);
      expect(message(container)).toBeFalsy();
    });

    it('UIC-TAGS-INPUT-4.5 keeps allowed duplicates apart and removes a tag left empty', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <EditableField
          defaultValue={['Fig', 'Fig', 'Kiwi']}
          allowsDuplicates
          onChange={onChange}
        />,
      );
      await user.dblClick(screen.getAllByText('Fig')[1] as HTMLElement);
      const editor = screen.getByRole('textbox', { name: 'Edit Fig' });
      await user.clear(editor);
      await user.type(editor, 'Plum{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['Fig', 'Plum', 'Kiwi']);
      await user.dblClick(screen.getByText('Plum'));
      await user.clear(screen.getByRole('textbox', { name: 'Edit Plum' }));
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenLastCalledWith(['Fig', 'Kiwi']);
    });

    it('UIC-TAGS-INPUT-4.5 accepts on blur, and restores a refused draft on blur', async () => {
      const user = userEvent.setup();
      render(
        <>
          <EditableField />
          <button type="button">Elsewhere</button>
        </>,
      );
      await user.dblClick(screen.getByText('Fig'));
      await user.type(screen.getByRole('textbox', { name: 'Edit Fig' }), 's');
      await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(tagTexts()).toEqual(['Apple', 'Figs', 'Kiwi']);
      await user.dblClick(screen.getByText('Figs'));
      await user.clear(screen.getByRole('textbox', { name: 'Edit Figs' }));
      await user.type(screen.getByRole('textbox', { name: 'Edit Figs' }), 'Kiwi');
      await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
      expect(tagTexts()).toEqual(['Apple', 'Figs', 'Kiwi']);
      expect(screen.queryByRole('textbox', { name: /^Edit/ })).not.toBeInTheDocument();
    });

    it('UIC-TAGS-INPUT-4.5 leaves keys an input method composes and ends on outside changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<EditableField value={['Apple', 'Fig']} />);
      await user.dblClick(screen.getByText('Fig'));
      const editor = screen.getByRole('textbox', { name: 'Edit Fig' });
      // eslint-disable-next-line testing-library/prefer-user-event -- an Enter an input method sends while it composes
      fireEvent.keyDown(editor, { key: 'Enter', isComposing: true });
      expect(editor).toBeInTheDocument();
      rerender(<EditableField value={['Fig']} />);
      expect(screen.queryByRole('textbox', { name: 'Edit Fig' })).not.toBeInTheDocument();
      await user.dblClick(screen.getByText('Fig'));
      expect(screen.getByRole('textbox', { name: 'Edit Fig' })).toBeInTheDocument();
      rerender(<EditableField value={['Fig']} isReadOnly />);
      expect(screen.queryByRole('textbox', { name: 'Edit Fig' })).not.toBeInTheDocument();
      await user.dblClick(screen.getByText('Fig'));
      expect(screen.queryByRole('textbox', { name: 'Edit Fig' })).not.toBeInTheDocument();
    });

    it('UIC-TAGS-INPUT-4.5 opens no editor without allowsEditing', async () => {
      const user = userEvent.setup();
      render(<TagsInput label="Fruit" defaultValue={['Fig']} />);
      await user.dblClick(screen.getByText('Fig'));
      await user.keyboard('{F2}');
      expect(screen.queryByRole('textbox', { name: 'Edit Fig' })).not.toBeInTheDocument();
    });
  });
});
