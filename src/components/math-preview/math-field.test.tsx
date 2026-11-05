import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MathField } from './math-field.js';

describe('MathField', () => {
  it('UIC-MATH-PREVIEW-2.1 pairs a highlighted source editor with its preview', async () => {
    const { container } = render(
      <MathField label="Formula" defaultValue="x^{2}" className="host" data-kind="sample" />,
    );
    const editor = screen.getByRole('textbox', { name: 'Formula' });
    const root = container.querySelector('.ui-math-field');
    expect(root).toHaveClass('ui-field', 'host');
    expect(root).toHaveAttribute('data-display', 'display');
    expect(
      container.querySelector('[data-token="keyword"], [data-token="operator"]'),
    ).not.toBeNull();
    await waitFor(() => expect(root).toHaveAttribute('data-status', 'ready'));
    expect(screen.getByRole('group', { name: 'Preview' })).toBeInTheDocument();
    expect(editor).toHaveAccessibleDescription(expect.stringContaining('x')); // the MathML text
    expectHooksMatchSpec(container, 'MATH-PREVIEW', {
      slots: ['editor', 'preview', 'status', 'math'],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-MATH-PREVIEW-2.1 keeps the caret and focus while the preview updates', async () => {
    const user = userEvent.setup();
    const { container } = render(<MathField label="Formula" defaultValue="a+b" />);
    const editor = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Formula' });
    await user.click(editor);
    editor.setSelectionRange(1, 1);
    await user.keyboard('c');
    await waitFor(() =>
      expect(container.querySelector('.ui-math-field')).toHaveAttribute('data-status', 'ready'),
    );
    expect(editor).toHaveValue('ac+b');
    expect(editor).toHaveFocus();
    expect(editor.selectionStart).toBe(2);
  });

  it('UIC-MATH-PREVIEW-2.2 commits on blur, restores on Escape and announces errors', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = render(
      <div role="group" aria-label="Dialog" onKeyDown={(event) => onKeyDown(event.key)}>
        <MathField label="Formula" defaultValue="x" onCommit={onCommit} />
        <button type="button">Done</button>
      </div>,
    );
    const editor = screen.getByRole('textbox', { name: 'Formula' });
    await user.click(editor);
    await user.keyboard('{End}\\frac{{1');
    await waitFor(() =>
      expect(container.querySelector('.ui-math-field__status')).toHaveTextContent(/expected '}'/),
    );
    expect(container.querySelector('.ui-math-field__status')).toHaveAttribute('role', 'status');
    await user.keyboard('{Escape}');
    expect(editor).toHaveValue('x');
    expect(onKeyDown).not.toHaveBeenCalledWith('Escape');
    await user.keyboard('{End}+1{Enter}+2');
    expect(editor).toHaveValue('x+1\n+2');
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onCommit).toHaveBeenLastCalledWith('x+1\n+2');
  });

  it('UIC-MATH-PREVIEW-2.2 leaves composing keys to the input method and locks', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <>
        <MathField label="Formula" defaultValue="y" onCommit={onCommit} />
        <MathField label="Locked" defaultValue="z" isReadOnly />
        <MathField label="Off" defaultValue="z" isDisabled />
      </>,
    );
    const editor = screen.getByRole('textbox', { name: 'Formula' });
    await user.type(editor, '1');
    pressComposingKeys(editor);
    expect(editor).toHaveValue('y1');
    expect(screen.getByRole('textbox', { name: 'Locked' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Off' })).toBeDisabled();
  });
});
