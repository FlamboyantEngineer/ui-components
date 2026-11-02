import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import type { MessageComposerMessage } from '../composer-message.js';
import {
  RichMessageComposer,
  type MessageComposerHandle,
  type MessageComposerPaste,
  type MessageComposerPasteResult,
  type RichMessageComposerProps,
} from './rich-message-composer.js';

installEditorDom();

const ana = { kind: 'mention', id: 'ana', label: 'Ana Lopez' } as const;
const box = () => screen.getByRole('textbox', { name: 'Message' });
const DRAFT: MessageComposerMessage = {
  text: 'Ask @Ana Lopez about\nthe **plan**',
  tokens: [{ ...ana, start: 4, end: 14 }],
};

function renderComposer(props: Partial<RichMessageComposerProps> = {}) {
  const user = userEvent.setup();
  const handle = createRef<MessageComposerHandle>();
  const onChange = vi.fn<(message: MessageComposerMessage) => void>();
  const view = render(
    <RichMessageComposer handleRef={handle} onChange={onChange} defaultValue={DRAFT} {...props} />,
  );
  /** Calls the handle as a host's own control does, inside React's batching. */
  const call = <T,>(run: (current: MessageComposerHandle) => T): T => {
    let result: T | undefined;
    act(() => {
      result = run(handle.current as MessageComposerHandle);
    });
    return result as T;
  };
  return { ...view, user, handle, onChange, call };
}

function pasteText(text: string) {
  return {
    types: ['text/plain'],
    files: [],
    items: [],
    getData: (type: string) => (type === 'text/plain' ? text : ''),
  } as unknown as DataTransfer;
}

describe('RichMessageComposer selection and ranges', () => {
  it('UIC-MESSAGE-COMPOSER-4.11 gives the text box its own id apart from the root id', () => {
    const { container } = renderComposer({ id: 'frame', inputId: 'composer-input' });
    expect(box()).toHaveAttribute('id', 'composer-input');
    expect(container.querySelector('#frame')).toHaveClass('ui-message-composer');
  });

  it('UIC-MESSAGE-COMPOSER-4.11 reads and restores the selection in message text, keeping it while focus is elsewhere', async () => {
    const onSelectionChange = vi.fn();
    const { user, call } = renderComposer({ onSelectionChange });
    expect(call((handle) => handle.setSelection({ start: 15, end: 20 }))).toBe('applied');
    expect(call((handle) => handle.getSelection())).toEqual({ start: 15, end: 20 });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ start: 15, end: 20 });
    // A range starting inside the pill takes in the whole pill; a caret moves to its nearer edge.
    expect(call((handle) => handle.setSelection({ start: 6, end: 20 }))).toBe('applied');
    expect(call((handle) => handle.getSelection())).toEqual({ start: 4, end: 20 });
    call((handle) => handle.setSelection({ start: 12, end: 12 }));
    expect(call((handle) => handle.getSelection())).toEqual({ start: 14, end: 14 });
    await user.click(document.body);
    expect(call((handle) => handle.getSelection())).toEqual({ start: 14, end: 14 });
    expect(call((handle) => handle.setSelection({ start: 0, end: 99 }))).toBe('invalid');
  });

  it('UIC-MESSAGE-COMPOSER-4.11 replaces a range across lines and a token as one undo step, then focuses with the caret after it', async () => {
    const { user, call, handle } = renderComposer();
    const fragment = {
      text: '@Jon Berg first',
      tokens: [{ kind: 'mention' as const, id: 'jon', label: 'Jon Berg', start: 0, end: 9 }],
    };
    expect(call((current) => current.replaceRange({ start: 6, end: 24 }, fragment))).toBe(
      'applied',
    );
    expect(box()).toHaveFocus();
    // The range starts inside the pill, so the whole pill goes.
    expect(handle.current?.getDraft()).toEqual({
      text: 'Ask @Jon Berg first **plan**',
      tokens: [{ kind: 'mention', id: 'jon', label: 'Jon Berg', start: 4, end: 13 }],
    });
    expect(call((current) => current.getSelection())).toEqual({ start: 19, end: 19 });
    await user.keyboard('{Control>}z{/Control}');
    expect(handle.current?.getDraft()).toEqual(DRAFT);
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(handle.current?.getDraft().text).toBe('Ask @Jon Berg first **plan**');
  });

  it('UIC-MESSAGE-COMPOSER-4.11 replaces the selection kept from before focus left', async () => {
    const { user, call, handle } = renderComposer();
    call((current) => current.setSelection({ start: 21, end: 24 }));
    await user.click(document.body);
    expect(call((current) => current.replaceSelection('a'))).toBe('applied');
    expect(handle.current?.getDraft().text).toBe('Ask @Ana Lopez about\na **plan**');
  });

  it('UIC-MESSAGE-COMPOSER-4.11 refuses range edits while disabled, editing or without an editor', () => {
    const { call, rerender, handle } = renderComposer({ isDisabled: true });
    expect(call((current) => current.replaceRange({ start: 0, end: 0 }, 'x'))).toBe('disabled');
    rerender(
      <RichMessageComposer
        handleRef={handle}
        defaultValue={DRAFT}
        editValue={{ text: 'Old', tokens: [] }}
      />,
    );
    expect(call((current) => current.replaceSelection('x'))).toBe('editing');
    expect(call((current) => current.getSelection())).toEqual({ start: 3, end: 3 });
  });

  it('UIC-MESSAGE-COMPOSER-4.11 keeps the caret place when a controlled value projects the text', async () => {
    const user = userEvent.setup();
    const handle = createRef<MessageComposerHandle>();
    function Projected() {
      const [value, setValue] = useState<MessageComposerMessage>({ text: 'one two', tokens: [] });
      return (
        <RichMessageComposer
          handleRef={handle}
          value={value}
          // The host upper-cases what is typed.
          onChange={(next) => setValue({ ...next, text: next.text.toUpperCase() })}
        />
      );
    }
    render(<Projected />);
    act(() => {
      handle.current?.setSelection({ start: 3, end: 3 });
      handle.current?.focus();
    });
    await user.keyboard('x');
    expect(handle.current?.getDraft().text).toBe('ONEX TWO');
    expect(handle.current?.getSelection()).toEqual({ start: 4, end: 4 });
  });
});

describe('RichMessageComposer paste', () => {
  it('UIC-MESSAGE-COMPOSER-4.12 hands pasted text to onPaste with its range, and pastes a fragment or refuses', async () => {
    const onPaste = vi.fn<(paste: MessageComposerPaste) => MessageComposerPasteResult>();
    const { user, call, handle } = renderComposer({ onPaste });
    call((current) => current.setSelection({ start: 15, end: 20 }));
    call((current) => current.focus());
    onPaste.mockReturnValueOnce({
      text: 'ref',
      tokens: [{ kind: 'reference', id: 'r1', label: 'ref', start: 0, end: 3 }],
    });
    await user.paste(pasteText('https://example.test/r1'));
    expect(onPaste).toHaveBeenCalledWith({
      text: 'https://example.test/r1',
      range: { start: 15, end: 20 },
    });
    expect(handle.current?.getDraft().text).toBe('Ask @Ana Lopez ref\nthe **plan**');
    expect(handle.current?.getDraft().tokens.at(-1)).toEqual({
      kind: 'reference',
      id: 'r1',
      label: 'ref',
      start: 15,
      end: 18,
    });
    onPaste.mockReturnValueOnce(null);
    await user.paste(pasteText('ignored'));
    expect(handle.current?.getDraft().text).toBe('Ask @Ana Lopez ref\nthe **plan**');
    onPaste.mockImplementationOnce(() => {
      throw new Error('broken');
    });
    await user.paste(pasteText('!'));
    expect(handle.current?.getDraft().text).toBe('Ask @Ana Lopez ref!\nthe **plan**');
  });

  it('UIC-MESSAGE-COMPOSER-4.12 pastes plain text at once and replaces it with a later answer, as its own undo step', async () => {
    let resolve: (fragment: MessageComposerMessage | null) => void = () => undefined;
    const onPaste = vi.fn(
      () =>
        new Promise<MessageComposerMessage | null>((settle) => {
          resolve = settle;
        }),
    );
    const { user, call, handle } = renderComposer({
      onPaste,
      defaultValue: { text: 'See ', tokens: [] },
    });
    call((current) => current.focus());
    await user.paste(pasteText('link'));
    expect(handle.current?.getDraft().text).toBe('See link');
    // Typing on while the answer is on its way stays.
    await user.keyboard(' now');
    await act(async () => {
      resolve({
        text: 'Doc',
        tokens: [{ kind: 'reference', id: 'd', label: 'Doc', start: 0, end: 3 }],
      });
      await Promise.resolve();
    });
    expect(handle.current?.getDraft()).toEqual({
      text: 'See Doc now',
      tokens: [{ kind: 'reference', id: 'd', label: 'Doc', start: 4, end: 7 }],
    });
    expect(call((current) => current.getSelection())).toEqual({ start: 11, end: 11 });
    await user.keyboard('{Control>}z{/Control}');
    expect(handle.current?.getDraft().text).toBe('See link now');
  });

  it('UIC-MESSAGE-COMPOSER-4.12 drops a late answer once the pasted text changed, the draft owner changed or the paste failed', async () => {
    const answers: ((fragment: MessageComposerMessage) => void)[] = [];
    const failures: ((error: Error) => void)[] = [];
    const onPaste = vi.fn(
      () =>
        new Promise<MessageComposerMessage>((resolve, reject) => {
          answers.push(resolve);
          failures.push(reject);
        }),
    );
    const doc = { text: 'Doc', tokens: [] };
    const { user, call, handle, rerender } = renderComposer({
      onPaste,
      defaultValue: { text: '', tokens: [] },
    });
    call((current) => current.focus());
    await user.paste(pasteText('abc'));
    call((current) => current.replaceRange({ start: 1, end: 2 }, 'Z'));
    await act(async () => {
      answers[0]?.(doc);
      await Promise.resolve();
    });
    expect(handle.current?.getDraft().text).toBe('aZc');
    await user.paste(pasteText('xyz'));
    await act(async () => {
      failures[1]?.(new Error('offline'));
      await Promise.resolve();
    });
    expect(handle.current?.getDraft().text).toBe('aZxyzc');
    await user.paste(pasteText('later'));
    rerender(
      <RichMessageComposer handleRef={handle} onPaste={onPaste} persistKey="another-draft" />,
    );
    await act(async () => {
      answers[2]?.(doc);
      await Promise.resolve();
    });
    await waitFor(() => expect(handle.current?.getDraft().text).not.toContain('Doc'));
  });
});
