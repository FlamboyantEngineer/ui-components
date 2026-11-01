import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createDeferredCompletions } from '../../../test/completion-fixtures.js';
import { CodeEditor, type CodeEditorSurfaceProps } from './code-editor.js';

function Editor(props: Omit<CodeEditorSurfaceProps, 'value' | 'variant'>) {
  const [value, setValue] = useState('');
  return (
    <CodeEditor
      {...props}
      variant="surface"
      aria-label="Source"
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

function source() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Source' });
}

function compose(value: string) {
  // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot send composing input
  fireEvent.input(source(), {
    target: { value },
    isComposing: true,
    inputType: 'insertCompositionText',
  });
}

describe('CodeEditor input composition', () => {
  it('UIC-CODE-EDITOR-4.2 suspends suggestions and editing keys until the final input commits once', async () => {
    const user = userEvent.setup();
    const completions = vi.fn(() => [{ label: 'apple' }]);
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    render(<Editor completions={completions} onChange={onChange} onKeyDown={onKeyDown} />);
    await user.type(source(), 'a');
    await screen.findByRole('option', { name: 'apple' });
    completions.mockClear();
    onChange.mockClear();
    onKeyDown.mockClear();
    fireEvent.compositionStart(source());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    compose('ap');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('ap');
    expect(completions).not.toHaveBeenCalled();
    // eslint-disable-next-line testing-library/prefer-user-event -- the active composition owns this key even without browser flags
    expect(fireEvent.keyDown(source(), { key: 'Enter' })).toBe(true);
    expect(onKeyDown).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ key: 'Enter' }));
    expect(source()).toHaveValue('ap');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.compositionEnd(source(), { data: 'ap' });
    await screen.findByRole('option', { name: 'apple' });
    expect(completions).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ value: 'ap', caret: 2, query: 'ap' }),
    );
    expect(source()).toHaveFocus();
    expect(source().selectionStart).toBe(2);
    await user.keyboard('{Tab}');
    expect(source()).toHaveValue('apple');
    expect(source().selectionStart).toBe(5);
  });

  it('UIC-CODE-EDITOR-4.2 waits for a final input sent after compositionend', async () => {
    const user = userEvent.setup();
    const completions = vi.fn(() => [{ label: 'apple' }]);
    render(<Editor completions={completions} />);
    await user.type(source(), 'a');
    await screen.findByRole('option', { name: 'apple' });
    completions.mockClear();
    fireEvent.compositionStart(source());
    fireEvent.compositionEnd(source(), { data: 'ap', target: { value: 'ap' } });
    expect(completions).not.toHaveBeenCalled();
    compose('ap');
    await screen.findByRole('option', { name: 'apple' });
    expect(completions).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ value: 'ap', caret: 2 }),
    );
  });

  it('UIC-CODE-EDITOR-4.2 cancels a pending answer and resumes an unchanged final value', async () => {
    const user = userEvent.setup();
    const deferred = createDeferredCompletions();
    render(<Editor completions={deferred.source} />);
    await user.type(source(), 'a');
    fireEvent.compositionStart(source());
    await deferred.answer();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.compositionEnd(source(), { data: 'a' });
    await deferred.answer();
    expect(await screen.findByRole('option', { name: 'alpha' })).toBeVisible();
    expect(source()).toHaveValue('a');
    expect(source()).toHaveFocus();
  });
});
