import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MessageComposerAttachButton, MessageComposerEmojiButton } from './composer-tools.js';
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
  it('UIC-MESSAGE-COMPOSER-3.1 UIC-MESSAGE-COMPOSER-1.5 shows the banner above the attachments and the controls in order', () => {
    const { container } = render(
      <MessageComposer
        banner={<span>Replying to Maria</span>}
        attachments={<span>Notes.txt</span>}
        onAttach={() => undefined}
        startControls={
          <>
            <MessageComposerEmojiButton />
            <MessageComposerAttachButton />
          </>
        }
        endControls={<button>Model</button>}
      />,
    );
    const banner = container.querySelector('.ui-message-composer__banner');
    expect(banner).toHaveTextContent('Replying to Maria');
    expect(banner?.nextElementSibling).toHaveClass('ui-message-composer__attachments');
    const names = (group: string) =>
      [...(container.querySelector(group)?.querySelectorAll('button') ?? [])].map(
        (button) => button.getAttribute('aria-label') ?? button.textContent,
      );
    expect(names('.ui-message-composer__start')).toEqual(['Insert emoji', 'Attach files']);
    expect(names('.ui-message-composer__end')).toEqual(['Model', 'Send']);
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', {
      slots: ['banner', 'attachments', 'footer', 'start', 'end', 'attach', 'emoji', 'action'],
    });
  });

  it('UIC-MESSAGE-COMPOSER-3.2 attaches files from the chooser, a drop and a paste', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    const { container } = render(
      <MessageComposer onAttach={onAttach} startControls={<MessageComposerAttachButton />} />,
    );
    const attach = screen.getByRole('button', { name: 'Attach files' });
    expect(attach).toHaveClass('ui-button', 'ui-message-composer__attach');
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

  it('UIC-MESSAGE-COMPOSER-3.2 pastes text copied with a picture of it as text, and attaches a copied image', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    render(<MessageComposer onAttach={onAttach} />);
    const picture = file('Copied.png', 'image/png');
    const clipboard = (data: Record<string, string>) => ({
      ...filesTransfer([picture]),
      types: ['Files', ...Object.keys(data)],
      getData: (type: string) => data[type === 'text' ? 'text/plain' : type] ?? '',
    });
    await user.click(input());
    await user.paste(
      clipboard({ 'text/html': '<b>Pears</b>', 'text/plain': 'Pears' }) as unknown as DataTransfer,
    );
    expect(onAttach).not.toHaveBeenCalled();
    expect(input()).toHaveValue('Pears');
    await user.paste(clipboard({ 'text/html': '<img src="x.png">' }) as unknown as DataTransfer);
    expect(onAttach).toHaveBeenLastCalledWith([picture]);
    await user.paste(clipboard({ 'text/plain': 'Copied.png' }) as unknown as DataTransfer);
    expect(onAttach).toHaveBeenCalledTimes(2);
    expect(input()).toHaveValue('Pears');
  });

  it('UIC-MESSAGE-COMPOSER-3.2 renders no attach button without onAttach', () => {
    render(<MessageComposer startControls={<MessageComposerAttachButton />} />);
    expect(screen.queryByRole('button', { name: 'Attach files' })).not.toBeInTheDocument();
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
      render(
        <MessageComposer
          defaultValue="Lunch ?"
          startControls={<MessageComposerEmojiButton />}
          onChange={onChange}
        />,
      );
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
