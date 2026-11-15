import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import { CodeEditor } from './code-editor.js';

describe('CodeEditor submission', () => {
  it('UIC-CODE-EDITOR-1.9 submits a controlled surface before the caller keyboard handler', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <CodeEditor
        variant="surface"
        aria-label="Query"
        value="select title"
        multiline={false}
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
      />,
    );
    await user.click(screen.getByRole('textbox', { name: 'Query' }));
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('select title');
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('UIC-CODE-EDITOR-1.9 submits the current single-line source without changing it', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CodeEditor
        label="Query"
        defaultValue="select title"
        multiline={false}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Query' });
    await user.click(input);
    await user.keyboard('{End}{Shift>}{Enter}{/Shift}{Alt>}{Enter}{/Alt}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('select title');
    expect(input).toHaveValue('select title');
  });

  it('UIC-CODE-EDITOR-1.9 reserves plain Enter for multiline editing and submits command Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CodeEditor label="Query" defaultValue="select title" onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: 'Query' });
    await user.click(input);
    await user.keyboard('{End}{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue('select title\n');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenLastCalledWith('select title\n');
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onSubmit).toHaveBeenLastCalledWith('select title\n');
  });

  it('UIC-CODE-EDITOR-1.9 lets completion consume Enter before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CodeEditor
        label="Query"
        multiline={false}
        completions={[{ label: 'select' }]}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Query' });
    await user.type(input, 'sel');
    await screen.findByRole('option', { name: 'select' });
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('select');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('select');
  });

  it('UIC-CODE-EDITOR-1.9 leaves input-method Enter alone', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CodeEditor label="Query" defaultValue="text" multiline={false} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: 'Query' });
    await user.click(input);
    pressComposingKeys(input);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['isReadOnly', 'isDisabled'] as const)(
    'UIC-CODE-EDITOR-1.9 refuses submission when %s',
    async (lock) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <CodeEditor
          label="Query"
          defaultValue="text"
          multiline={false}
          onSubmit={onSubmit}
          {...{ [lock]: true }}
        />,
      );
      const input = screen.getByRole('textbox', { name: 'Query' });
      await user.click(input);
      await user.keyboard('{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );
});
