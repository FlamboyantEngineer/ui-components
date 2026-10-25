import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MessageComposer } from './message-composer.js';

const input = () => screen.getByRole<HTMLTextAreaElement>('textbox');
const root = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.ui-message-composer') as HTMLElement;

function file(name: string, type = 'text/plain'): File {
  return new File(['x'], name, { type });
}

/** A native data transfer carrying files, as a drag or a paste reads it. */
function filesTransfer(files: File[]) {
  return {
    types: ['Files'],
    files,
    items: files.map((entry) => ({ kind: 'file', type: entry.type, getAsFile: () => entry })),
    dropEffect: 'none',
    effectAllowed: 'all',
    getData: () => '',
  };
}

describe('MessageComposer frame', () => {
  it('UIC-MESSAGE-COMPOSER-3.1 UIC-MESSAGE-COMPOSER-1.5 shows the banner above the attachments and the tools in order', () => {
    const { container } = render(
      <MessageComposer
        banner={<span>Replying to Maria</span>}
        attachments={<span>Notes.txt</span>}
        onAttach={() => undefined}
        showEmojiPicker
        toolbar={<button>Model</button>}
      />,
    );
    const banner = container.querySelector('.ui-message-composer__banner');
    expect(banner).toHaveTextContent('Replying to Maria');
    expect(banner?.nextElementSibling).toHaveClass('ui-message-composer__attachments');
    const toolbar = container.querySelector('.ui-message-composer__toolbar');
    const names = [...(toolbar?.querySelectorAll('button') ?? [])].map(
      (button) => button.getAttribute('aria-label') ?? button.textContent,
    );
    expect(names).toEqual(['Attach files', 'Insert emoji', 'Model']);
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
      slots: ['banner', 'attachments', 'toolbar', 'attach', 'emoji'],
    });
  });

  it('UIC-MESSAGE-COMPOSER-3.2 attaches files from the chooser, a drop and a paste', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    const { container } = render(<MessageComposer onAttach={onAttach} />);
    const attach = screen.getByRole('button', { name: 'Attach files' });
    expect(attach).toHaveClass('ui-icon-button', 'ui-message-composer__attach');
    const chooser = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!chooser) throw new Error('no chooser');
    expect(chooser).toHaveAttribute('multiple');
    const notes = file('Notes.txt');
    await user.upload(chooser, notes);
    expect(onAttach).toHaveBeenLastCalledWith([notes]);

    const photo = file('Photo.png', 'image/png');
    const dataTransfer = filesTransfer([photo]);
    fireEvent.dragEnter(input(), { dataTransfer });
    expect(root(container)).toHaveAttribute('data-drop-target', 'true');
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER');
    fireEvent.dragLeave(input(), { dataTransfer });
    expect(root(container)).not.toHaveAttribute('data-drop-target');
    fireEvent.dragEnter(root(container), { dataTransfer });
    fireEvent.drop(root(container), { dataTransfer });
    expect(onAttach).toHaveBeenLastCalledWith([photo]);
    expect(root(container)).not.toHaveAttribute('data-drop-target');

    fireEvent.dragEnter(input(), { dataTransfer: { types: ['text/plain'], files: [] } });
    expect(root(container)).not.toHaveAttribute('data-drop-target');

    await user.click(input());
    await user.paste(filesTransfer([notes]) as unknown as DataTransfer);
    expect(onAttach).toHaveBeenLastCalledWith([notes]);
    await user.paste('Plain text');
    expect(input()).toHaveValue('Plain text');
    expect(onAttach).toHaveBeenCalledTimes(3);
  });

  it('UIC-MESSAGE-COMPOSER-1.4 ignores dropped and pasted files while disabled', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    const { container } = render(<MessageComposer isDisabled onAttach={onAttach} />);
    const dataTransfer = filesTransfer([file('Notes.txt')]);
    fireEvent.dragEnter(root(container), { dataTransfer });
    expect(root(container)).not.toHaveAttribute('data-drop-target');
    fireEvent.drop(root(container), { dataTransfer });
    await user.paste(dataTransfer as unknown as DataTransfer);
    expect(onAttach).not.toHaveBeenCalled();
  });

  it(
    'UIC-MESSAGE-COMPOSER-3.7 inserts the chosen emoji at the caret and returns focus to the text',
    // The bundled emoji set loads on first open; slow on a busy machine.
    { timeout: 15_000 },
    async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<MessageComposer defaultValue="Lunch ?" showEmojiPicker onChange={onChange} />);
      await user.click(input());
      input().setSelectionRange(6, 6);
      const emoji = screen.getByRole('button', { name: 'Insert emoji' });
      expect(emoji).toHaveClass('ui-message-composer__emoji');
      await user.click(emoji);
      await user.type(await screen.findByRole('searchbox'), 'pizza');
      await user.click(await screen.findByRole('row', { name: 'pizza' }, { timeout: 10_000 }));
      expect(onChange).toHaveBeenLastCalledWith('Lunch 🍕?');
      await waitFor(() => expect(input()).toHaveFocus());
      expect(input().selectionStart).toBe(8);
    },
  );
});
