import { isEmptyValue } from '../../utils/is-empty-value.js';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { NumberField } from '../number-field/number-field.js';
import { InlineEdit, type InlineEditProps } from './inline-edit.js';
import { isSameValue } from './use-inline-edit.js';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** An inline edit whose saved value follows its saves. */
function Saved(props: Omit<InlineEditProps, 'value' | 'onSave'> & { initial?: string }) {
  const { initial = 'Rye loaf', ...rest } = props;
  const [value, setValue] = useState(initial);
  return <InlineEdit {...rest} value={value} onSave={setValue} />;
}

const read = () => screen.getByRole('button', { name: /^Edit Title/ });
const textbox = () => screen.getByRole('textbox', { name: 'Title' });

describe('InlineEdit', { timeout: 15_000 }, () => {
  it('UIC-INLINE-EDIT-1.1 UIC-INLINE-EDIT-1.9 shows the value in a read view button', () => {
    const { container, rerender } = render(
      <InlineEdit
        label="Title"
        value="Rye loaf"
        onSave={() => {}}
        className="extra"
        id="title"
        data-lab="title"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('ui-inline-edit', 'extra');
    expect(root).toHaveAttribute('id', 'title');
    expect(root).toHaveAttribute('data-lab', 'title');
    expect(root).not.toHaveAttribute('data-editing');
    expect(read()).toHaveClass('ui-inline-edit__read');
    expect(read().querySelector('.ui-inline-edit__value')).toHaveTextContent('Rye loaf');
    expect(read().querySelector('.ui-inline-edit__icon')).toHaveAttribute('data-glyph', 'edit');
    expectHooksMatchSpec(container, 'INLINE-EDIT', {
      slots: ['read', 'value', 'icon'],
      callerAttributes: ['data-lab'],
    });
    rerender(<InlineEdit label="Title" value="  " placeholder="Add a title" onSave={() => {}} />);
    expect(root).toHaveAttribute('data-empty', 'true');
    expect(read().querySelector('.ui-inline-edit__placeholder')).toHaveTextContent('Add a title');
    expect(read().querySelector('.ui-inline-edit__value')).toBeNull();
    rerender(
      <InlineEdit<number>
        label="Servings"
        value={4}
        renderValue={(servings) => `${servings} servings`}
        onSave={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /^Edit Servings/ })).toHaveTextContent('4 servings');
  });

  it('UIC-INLINE-EDIT-1.1 treats nullish, blank and empty lists as empty', () => {
    expect([null, undefined, '', ' ', []].every(isEmptyValue)).toBe(true);
    expect([0, 'a', ['a'], false].some(isEmptyValue)).toBe(false);
    expect(isSameValue(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isSameValue({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('UIC-INLINE-EDIT-1.2 UIC-INLINE-EDIT-1.3 opens the editor on a press, Enter, Space or F2', async () => {
    const user = userEvent.setup();
    const onEditingChange = vi.fn();
    const { container } = render(<Saved label="Title" onEditingChange={onEditingChange} />);
    const root = container.firstElementChild as HTMLElement;
    await user.click(read());
    expect(root).toHaveAttribute('data-editing', 'true');
    expect(onEditingChange).toHaveBeenLastCalledWith(true);
    expect(textbox()).toHaveFocus();
    expect(textbox()).toHaveValue('Rye loaf');
    expect((textbox() as HTMLInputElement).selectionStart).toBe(0);
    expect((textbox() as HTMLInputElement).selectionEnd).toBe(8);
    expect(container.querySelector('.ui-inline-edit__control')).toContainElement(textbox());
    expect(container.querySelector('.ui-field')).not.toHaveAttribute('data-dirty');
    expectHooksMatchSpec(container, 'INLINE-EDIT', { slots: ['editor', 'control'] });
    await user.keyboard('{Escape}');
    expect(onEditingChange).toHaveBeenLastCalledWith(false);
    for (const key of ['{Enter}', ' ', '{F2}']) {
      read().focus();
      await user.keyboard(key);
      expect(textbox()).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(read()).toHaveFocus();
    }
  });

  it('UIC-INLINE-EDIT-1.2 opens under control without taking focus on mount', async () => {
    const user = userEvent.setup();
    const onEditingChange = vi.fn();
    const { rerender } = render(
      <InlineEdit label="Title" value="Rye loaf" onSave={() => {}} isEditing />,
    );
    expect(textbox()).not.toHaveFocus();
    rerender(
      <InlineEdit
        label="Title"
        value="Rye loaf"
        onSave={() => {}}
        isEditing={false}
        onEditingChange={onEditingChange}
      />,
    );
    await user.click(read());
    expect(onEditingChange).toHaveBeenCalledWith(true);
    expect(read()).toBeInTheDocument();
    rerender(<InlineEdit label="Title" value="Rye loaf" onSave={() => {}} isEditing />);
    expect(textbox()).toHaveFocus();
  });

  it('UIC-INLINE-EDIT-1.2 UIC-INLINE-EDIT-1.3 reopens a controlled editor at the saved value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const editor = (isEditing: boolean) => (
      <InlineEdit label="Title" value="Rye loaf" onSave={onSave} isEditing={isEditing} />
    );
    const { rerender } = render(editor(false));
    rerender(editor(true));
    await user.clear(textbox());
    await user.type(textbox(), 'Draft');
    rerender(editor(false));
    rerender(editor(true));
    expect(textbox()).toHaveValue('Rye loaf');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('UIC-INLINE-EDIT-1.2 opens at first with defaultEditing', () => {
    render(<InlineEdit label="Title" value="Rye loaf" onSave={() => {}} defaultEditing />);
    expect(textbox()).not.toHaveFocus();
    expect(textbox()).toHaveValue('Rye loaf');
  });

  it('UIC-INLINE-EDIT-1.4 saves on Enter and returns focus to the read view', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit label="Title" value="Rye loaf" onSave={onSave} />);
    await user.click(read());
    await user.keyboard('Seeded rye{Enter}');
    expect(onSave).toHaveBeenCalledWith('Seeded rye');
    expect(read()).toHaveFocus();
    await user.click(read());
    await user.keyboard('{Enter}');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(read()).toHaveFocus();
  });

  it('UIC-INLINE-EDIT-1.4 saves when focus leaves the editor', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <>
        <InlineEdit label="Title" value="Rye loaf" onSave={onSave} showActions />
        <button type="button">Elsewhere</button>
      </>,
    );
    await user.click(read());
    await user.keyboard('Seeded rye');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.tab();
    await user.tab();
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Seeded rye'));
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('UIC-INLINE-EDIT-1.4 lets an editor save a value it chooses and keeps Enter in a text area', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <InlineEdit
        label="Notes"
        value="Rest overnight"
        onSave={onSave}
        renderEditor={({ value, onChange, commit, label }) => (
          <>
            <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
            <button type="button" onClick={() => commit('Bake at dawn')}>
              Preset
            </button>
          </>
        )}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Edit Notes/ }));
    const area = screen.getByRole('textbox', { name: 'Notes' });
    await user.keyboard('{Enter}');
    expect(onSave).not.toHaveBeenCalled();
    expect(area).toHaveValue('Rest overnight\n');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSave).toHaveBeenCalledWith('Rest overnight\n');
    await user.click(screen.getByRole('button', { name: /^Edit Notes/ }));
    await user.click(screen.getByRole('button', { name: 'Preset' }));
    expect(onSave).toHaveBeenLastCalledWith('Bake at dawn');
  });

  it('UIC-INLINE-EDIT-1.3 draws a caller editor such as a number field', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <InlineEdit<number>
        label="Servings"
        value={4}
        onSave={onSave}
        renderEditor={({ value, onChange, label }) => (
          <NumberField
            label={label}
            labelLayout="control-only"
            value={value}
            onChange={(next) => onChange(next ?? 0)}
          />
        )}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^Edit Servings/ }));
    const field = screen.getByRole('textbox', { name: 'Servings' });
    expect(field).toHaveFocus();
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onSave).toHaveBeenCalledWith(5);
  });

  it('UIC-INLINE-EDIT-1.5 cancels on Escape without saving and stops the key', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOuterKey = vi.fn();
    render(
      <div onKeyDown={(event) => onOuterKey(event.key)}>
        <InlineEdit label="Title" value="Rye loaf" onSave={onSave} />
      </div>,
    );
    await user.click(read());
    await user.keyboard('Seeded{Escape}');
    expect(onSave).not.toHaveBeenCalled();
    expect(onOuterKey).not.toHaveBeenCalledWith('Escape');
    expect(read()).toHaveFocus();
    expect(read()).toHaveTextContent('Rye loaf');
    await user.click(read());
    expect(textbox()).toHaveValue('Rye loaf');
  });

  it('UIC-INLINE-EDIT-1.6 UIC-INLINE-EDIT-2.1 waits on a pending save and shows a failure', async () => {
    const user = userEvent.setup();
    let save = deferred();
    const onSave = vi.fn(() => save.promise);
    const { container } = render(<InlineEdit label="Title" value="Rye loaf" onSave={onSave} />);
    const root = container.firstElementChild as HTMLElement;
    await user.click(read());
    await user.keyboard('Seeded rye{Enter}');
    expect(root).toHaveAttribute('data-pending', 'true');
    await user.keyboard('{Escape}{Enter}');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(textbox()).toBeInTheDocument();
    await act(async () => save.reject(new Error('The title is taken.')));
    expect(root).not.toHaveAttribute('data-pending');
    expect(root).toHaveAttribute('data-invalid', 'true');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('ui-inline-edit__error', 'ui-inline-error');
    expect(alert).toHaveTextContent('The title is taken.');
    expect(textbox()).toHaveValue('Seeded rye');
    expectHooksMatchSpec(container, 'INLINE-EDIT', { slots: ['error'] });
    save = deferred();
    expect(textbox()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => save.reject('nope'));
    expect(screen.getByRole('alert')).toHaveTextContent('The change could not be saved.');
    save = deferred();
    expect(textbox()).toHaveFocus();
    await user.keyboard('{Enter}');
    await act(async () => save.resolve());
    expect(read()).toHaveFocus();
    expect(root).not.toHaveAttribute('data-invalid');
  });

  it('UIC-INLINE-EDIT-1.7 draws save and cancel buttons', async () => {
    const user = userEvent.setup();
    const save = deferred();
    const onSave = vi.fn(() => save.promise);
    const { container } = render(
      <InlineEdit label="Title" value="Rye loaf" onSave={onSave} showActions />,
    );
    await user.click(read());
    expectHooksMatchSpec(container, 'INLINE-EDIT', { slots: ['actions', 'save', 'cancel'] });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(read()).toHaveFocus();
    await user.click(read());
    await user.keyboard('Seeded');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('Seeded');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await act(async () => save.resolve());
    expect(read()).toHaveFocus();
  });

  it('UIC-INLINE-EDIT-1.8 keeps a disabled value read only', async () => {
    const user = userEvent.setup();
    const onEditingChange = vi.fn();
    const { container } = render(
      <InlineEdit
        label="Title"
        value="Rye loaf"
        onSave={() => {}}
        isDisabled
        onEditingChange={onEditingChange}
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    expect(read()).toBeDisabled();
    expect(container.querySelector('.ui-inline-edit__icon')).toBeNull();
    await user.click(read());
    expect(onEditingChange).not.toHaveBeenCalled();
  });

  it('UIC-INLINE-EDIT-2.1 names the read view by its label and the value it shows', () => {
    const { rerender } = render(<Saved label="Title" />);
    expect(read()).toHaveAccessibleName('Edit Title Rye loaf');
    expect(read().querySelector('.ui-visually-hidden')).toHaveTextContent('Edit Title');
    rerender(<InlineEdit label="Title" value="" placeholder="Add a title" onSave={() => {}} />);
    expect(read()).toHaveAccessibleName('Edit Title Add a title');
  });
});
