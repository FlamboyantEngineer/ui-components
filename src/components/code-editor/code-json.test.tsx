import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CodeEditor } from './code-editor.js';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';

function field(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function editor() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Settings' });
}

describe('CodeEditor', () => {
  it('UIC-CODE-EDITOR-8.1 is a field whose control is a numbered code editor named by the label', () => {
    const { container } = render(
      <CodeEditor
        language="json"
        label="Settings"
        defaultValue={'{\n  "a": 1\n}'}
        placeholder="{}"
        id="settings"
        className="caller"
        data-testid="probe"
      />,
    );
    const root = field(container);
    expect(root).toHaveClass('ui-field', 'ui-code-editor', 'caller');
    expect(root).toHaveAttribute('id', 'settings');
    expect(root).toHaveAttribute('data-testid', 'probe');
    const input = editor();
    expect(input).toHaveAttribute('id', 'settings-control');
    expect(input).toHaveAttribute('placeholder', '{}');
    expect(input).toHaveAttribute('wrap', 'off');
    const code = container.querySelector('.ui-code-editor');
    expect(code).toHaveAttribute('data-size', 'md');
    expect(code?.querySelectorAll('.ui-code-editor__line')).toHaveLength(3);
    expectHooksMatchSpec(container, 'CODE-EDITOR', {
      slots: ['format'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CODE-EDITOR-8.1 takes a size and can hide the line numbers', () => {
    const { container } = render(
      <CodeEditor
        language="json"
        label="Settings"
        size="lg"
        lineNumbers={false}
        defaultValue="1"
      />,
    );
    expect(container.querySelector('.ui-code-editor')).toHaveAttribute('data-size', 'lg');
    expect(container.querySelector('.ui-code-editor__gutter')).toBeNull();
  });

  it('UIC-CODE-EDITOR-8.2 highlights the JSON tokens', () => {
    const { container } = render(
      <CodeEditor language="json" label="Settings" defaultValue={'{"a": true}'} />,
    );
    const tokens = [...container.querySelectorAll('.ui-code-editor__token')].map((token) =>
      token.getAttribute('data-token'),
    );
    expect(tokens).toEqual(['punctuation', 'key', 'punctuation', 'literal', 'punctuation']);
  });

  it('UIC-CODE-EDITOR-9.1 reports text that does not parse with where it stops', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CodeEditor language="json" label="Settings" defaultValue={'{"a": 1}'} />,
    );
    expect(field(container)).toHaveAttribute('data-validation', 'valid');
    await user.click(editor());
    await user.keyboard('{End}{Backspace}');
    expect(field(container)).toHaveAttribute('data-validation', 'invalid');
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      /^Enter valid JSON: check line 1, column \d+\.$/,
    );
    expect(editor()).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.ui-code-editor')).toHaveAttribute('data-invalid', 'true');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it("UIC-CODE-EDITOR-9.1 accepts blank text unless required, before the caller's check", () => {
    const validate = vi.fn(() => ({ severity: 'warning' as const, message: 'Check the keys.' }));
    const { container, rerender } = render(
      <CodeEditor language="json" label="Settings" validate={validate} />,
    );
    expect(field(container)).toHaveAttribute('data-validation', 'warning');
    rerender(<CodeEditor language="json" label="Settings" isRequired />);
    expect(container.querySelector('.ui-field__message')).toHaveTextContent('A value is required.');
    rerender(<CodeEditor language="json" label="Settings" value="{" validate={validate} />);
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(/^Enter valid JSON/);
  });

  it('UIC-CODE-EDITOR-10.1 formats valid text, commits it and is disabled when there is nothing to do', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <CodeEditor
        language="json"
        label="Settings"
        defaultValue={'{"a":[1]}'}
        indent={4}
        onCommit={onCommit}
      />,
    );
    const format = screen.getByRole('button', { name: 'Format' });
    expect(format).toHaveClass('ui-code-editor__format', 'ui-button');
    expect(container.querySelector('.ui-code-editor__toolbar')).toContainElement(format);
    await user.click(format);
    expect(editor()).toHaveValue('{\n    "a": [\n        1\n    ]\n}');
    expect(onCommit).toHaveBeenCalledWith('{\n    "a": [\n        1\n    ]\n}');
    expect(format).toBeDisabled();
    await user.clear(editor());
    await user.paste('{"a":');
    expect(editor()).toHaveValue('{"a":');
    expect(format).toBeDisabled();
    await user.clear(editor());
    expect(format).toBeDisabled();
    await user.paste('[1,2]');
    expect(editor()).toHaveValue('[1,2]');
    expect(format).toBeEnabled();
  });

  it('UIC-CODE-EDITOR-10.1 indents by two spaces by default, disables the button while disabled and drops it while read-only', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CodeEditor language="json" label="Settings" defaultValue="[1,2]" />,
    );
    await user.click(screen.getByRole('button', { name: 'Format' }));
    expect(editor()).toHaveValue('[\n  1,\n  2\n]');
    rerender(<CodeEditor language="json" label="Settings" value="[3]" isDisabled />);
    expect(screen.getByRole('button', { name: 'Format' })).toBeDisabled();
    rerender(<CodeEditor language="json" label="Settings" value="[3]" isReadOnly />);
    expect(screen.queryByRole('button', { name: 'Format' })).not.toBeInTheDocument();
  });

  it('UIC-CODE-EDITOR-10.1 keeps the caller toolbar as the button comes and goes', async () => {
    const user = userEvent.setup();
    const tree = (props: { isReadOnly?: boolean; language?: 'json' | 'text' }) => (
      <CodeEditor
        language="json"
        label="Settings"
        defaultValue="[1]"
        toolbar={
          <>
            <strong>Settings</strong>
            <button type="button">Count</button>
          </>
        }
        {...props}
      />
    );
    const { rerender } = render(tree({}));
    const count = screen.getByRole('button', { name: 'Count' });
    await user.click(count);
    expect(count).toHaveFocus();
    rerender(tree({ isReadOnly: true }));
    expect(screen.queryByRole('button', { name: 'Format' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Count' })).toBe(count);
    expect(count).toHaveFocus();
    rerender(tree({ language: 'text' }));
    expect(screen.getByRole('button', { name: 'Count' })).toBe(count);
    rerender(tree({}));
    expect(screen.getByRole('button', { name: 'Format' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Count' })).toBe(count);
    expect(count).toHaveFocus();
  });

  it('UIC-CODE-EDITOR-11.1 UIC-FIELD-1.11 commits on leaving the field and restores the committed text while dirty', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <CodeEditor language="json" label="Settings" committedValue="[1]" onCommit={onCommit} />,
    );
    await user.click(editor());
    await user.keyboard('{End}{ArrowLeft},2');
    expect(field(container)).toHaveAttribute('data-dirty', 'true');
    const restore = screen.getByRole('button', { name: 'Restore Settings' });
    await user.click(restore);
    expect(editor()).toHaveValue('[1]');
    expect(field(container)).not.toHaveAttribute('data-dirty');
    await user.keyboard('{End} ');
    // Tab from the edited editor reaches the restore button; leaving the field commits.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Restore Settings' })).toHaveFocus();
    expect(onCommit).not.toHaveBeenCalledWith('[1] ');
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith('[1] ');
  });

  it('UIC-CODE-EDITOR-11.2 undoes and redoes with the field chords and runs menu actions', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CodeEditor
        language="json"
        label="Settings"
        defaultValue="[]"
        menu={['clear', 'set-default']}
      />,
    );
    await user.click(editor());
    await user.keyboard('{End}{ArrowLeft}1');
    expect(editor()).toHaveValue('[1]');
    await user.keyboard('{Control>}z{/Control}');
    expect(editor()).toHaveValue('[]');
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(editor()).toHaveValue('[1]');
    await chooseFieldMenuItem(user, editor(), 'Clear');
    expect(editor()).toHaveValue('');
    await chooseFieldMenuItem(user, editor(), 'Set to default');
    expect(editor()).toHaveValue('[]');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-11.3 keeps a locked editor visible, unchanged and never dirty', () => {
    const { container, rerender } = render(
      <CodeEditor language="json" label="Settings" committedValue="[1]" value="[2]" isReadOnly />,
    );
    expect(editor()).toHaveAttribute('readonly');
    expect(field(container)).not.toHaveAttribute('data-dirty');
    expect(container.querySelector('.ui-code-editor__gutter')).not.toBeNull();
    rerender(
      <CodeEditor language="json" label="Settings" committedValue="[1]" value="[2]" isDisabled />,
    );
    expect(editor()).toBeDisabled();
    expect(field(container)).toHaveAttribute('data-disabled', 'true');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-9.3 marks where the text stops parsing in the editor, without a second list', () => {
    const { container } = render(
      <CodeEditor language="json" label="Settings" defaultValue={'{\n  "a": ,\n}'} />,
    );
    const mark = container.querySelector('.ui-code-editor__mark');
    expect(mark).toHaveTextContent(',');
    expect(mark).toHaveAttribute('data-severity', 'error');
    const lines = [...container.querySelectorAll('.ui-code-editor__line')];
    expect(lines.map((line) => line.getAttribute('data-severity'))).toEqual([null, 'error', null]);
    expect(container.querySelector('.ui-code-editor__diagnostics')).toBeNull();
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Enter valid JSON: check line 2, column 8.',
    );
    expect(editor()).toHaveAttribute('aria-invalid', 'true');
    expectHooksMatchSpec(container, 'CODE-EDITOR');
  });

  it('UIC-CODE-EDITOR-2.3 UIC-CODE-EDITOR-9.3 numbers its own problems from the first line number', async () => {
    const user = userEvent.setup();
    const parse = (firstLineNumber: number) => (
      <CodeEditor
        language="json"
        label="Settings"
        firstLineNumber={firstLineNumber}
        defaultValue={'{\n  "a": ,\n}'}
        diagnostics={[{ message: 'Caller note.', line: 102, severity: 'warning' }]}
      />
    );
    const { container, rerender } = render(parse(100));
    const severities = () =>
      [...container.querySelectorAll('.ui-code-editor__line')].map((line) =>
        line.getAttribute('data-severity'),
      );
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Enter valid JSON: check line 101, column 8.',
    );
    expect(
      container.querySelector('.ui-code-editor__mark[data-severity="error"]'),
    ).toHaveTextContent(',');
    expect(severities()).toEqual([null, 'error', 'warning']);
    await user.click(editor());
    await user.keyboard('{F8}');
    expect(editor().value.slice(editor().selectionStart, editor().selectionEnd)).toBe(',');
    rerender(parse(1));
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Enter valid JSON: check line 2, column 8.',
    );
    expect(severities()).toEqual([null, 'error', null]);
  });

  it('UIC-CODE-EDITOR-2.3 UIC-CODE-EDITOR-13.1 numbers schema problems from the first line number', () => {
    const schema = { type: 'object' as const, properties: { name: { type: 'string' as const } } };
    const { container } = render(
      <CodeEditor
        language="json"
        label="Settings"
        schema={schema}
        firstLineNumber={40}
        defaultValue={'{\n  "name": 3\n}'}
      />,
    );
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Line 41, column 11: Expected string.',
    );
    expect(container.querySelector('.ui-code-editor__mark')).toHaveTextContent('3');
  });

  it('UIC-CODE-EDITOR-13.1 checks parsed text against the schema and reports the first problem with its place', async () => {
    const user = userEvent.setup();
    const schema = {
      type: 'object' as const,
      properties: {
        servings: { type: 'integer' as const, maximum: 8 },
        name: { type: 'string' as const },
      },
    };
    const validate = vi.fn(() => null);
    const { container } = render(
      <CodeEditor
        language="json"
        label="Settings"
        schema={schema}
        validate={validate}
        defaultValue={'{"name": 3, "servings": 12}'}
      />,
    );
    expect(field(container)).toHaveAttribute('data-validation', 'invalid');
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Line 1, column 10: Expected string.',
    );
    const marks = [...container.querySelectorAll('.ui-code-editor__mark')];
    expect(marks.map((mark) => mark.textContent)).toEqual(['3', '12']);
    expect(validate).not.toHaveBeenCalled();
    await user.click(editor());
    await user.keyboard('{Control>}a{/Control}{{"name": "Soup"}');
    expect(field(container)).toHaveAttribute('data-validation', 'valid');
    expect(validate).toHaveBeenCalled();
    expect(container.querySelector('.ui-code-editor__mark')).toBeNull();
  });

  it('UIC-CODE-EDITOR-13.2 UIC-CODE-EDITOR-13.3 completes keys and values from the schema', async () => {
    const user = userEvent.setup();
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'What the dish is called.' },
        course: { enum: ['starter', 'main'] },
      },
    };
    render(<CodeEditor language="json" label="Settings" schema={schema} />);
    await user.click(editor());
    await user.keyboard('{{"na');
    const option = await screen.findByRole('option', { name: /^"name"/ });
    expect(option).toHaveAttribute('data-kind', 'property');
    expect(option).toHaveAccessibleDescription('What the dish is called.');
    await user.keyboard('{Enter}');
    expect(editor()).toHaveValue('{"name": ""');
    await user.keyboard('Soup{End}, "c');
    await screen.findByRole('option', { name: /^"course"/ });
    await user.keyboard('{Enter}');
    expect(editor()).toHaveValue('{"name": "Soup", "course": "starter"');
    expect(editor().value.slice(editor().selectionStart, editor().selectionEnd)).toBe('"starter"');
    await user.keyboard('{Control>} {/Control}');
    expect((await screen.findAllByRole('option')).map((entry) => entry.textContent)).toEqual([
      '"starter"',
      '"main"',
    ]);
  });

  it('UIC-CODE-EDITOR-14.1 pairs brackets when asked and keeps the indentation on Enter', async () => {
    const user = userEvent.setup();
    render(<CodeEditor language="json" label="Settings" indent={4} autoCloseBrackets />);
    await user.click(editor());
    await user.keyboard('[[');
    expect(editor()).toHaveValue('[]');
    await user.keyboard('{Enter}');
    expect(editor()).toHaveValue('[\n    \n]');
    await user.keyboard('{{');
    expect(editor()).toHaveValue('[\n    {}\n]');
  });

  it('UIC-CODE-EDITOR-13.2 UIC-CODE-EDITOR-13.3 inserts schema strings and objects as literal JSON', async () => {
    const user = userEvent.setup();
    const value = { literal: '${field}', brace: '}', slash: '\\' };
    render(
      <CodeEditor
        language="json"
        label="Settings"
        schema={{ properties: { payload: { const: value } } }}
        defaultValue="{"
      />,
    );
    await user.click(editor());
    await user.keyboard('{End}"pay{Enter}');
    expect(editor()).toHaveValue(`{"payload": ${JSON.stringify(value)}`);
    expect(editor().value.slice(editor().selectionStart, editor().selectionEnd)).toBe(
      JSON.stringify(value),
    );
    await user.keyboard('{End}');
    await user.paste('}');
    expect(JSON.parse(editor().value)).toEqual({ payload: value });
  });
});
