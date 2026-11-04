import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import { UiProvider } from '../../../core/provider.js';
import { createMemoryStorage } from '../../../core/storage.js';
import type { MessageComposerMessage } from '../composer-message.js';
import {
  type MessageComposerHandle,
  RichMessageComposer,
  type RichMessageComposerProps,
} from './rich-message-composer.js';

installEditorDom();

const ana = { kind: 'mention', id: 'ana', label: 'Ana Lopez' } as const;
const box = () => screen.getByRole('textbox', { name: 'Message' });

/** Renders a rich composer with its handle, recording its edits and what it sends. */
function renderComposer(props: Partial<RichMessageComposerProps> = {}) {
  const user = userEvent.setup();
  const handle = createRef<MessageComposerHandle>();
  const onChange = vi.fn<(message: MessageComposerMessage) => void>();
  const onSubmit = vi.fn<(message: MessageComposerMessage) => void | Promise<unknown>>();
  const view = render(
    <RichMessageComposer handleRef={handle} onChange={onChange} onSubmit={onSubmit} {...props} />,
  );
  /** Inserts a token as a control outside the composer does. */
  const insert = (token: Parameters<MessageComposerHandle['insertToken']>[0] = ana) => {
    let result: ReturnType<MessageComposerHandle['insertToken']> | undefined;
    act(() => {
      result = handle.current?.insertToken(token);
    });
    return result;
  };
  return { ...view, user, handle, onChange, onSubmit, insert };
}

/** Puts the caret after `offset` characters of the first line, as a click there does. */
async function placeCaret(user: ReturnType<typeof userEvent.setup>, offset: number) {
  const line = box().querySelector('p') as HTMLElement;
  await user.pointer({ keys: '[MouseLeft]', target: line, offset });
}

describe('RichMessageComposer handle', () => {
  it('UIC-MESSAGE-COMPOSER-4.10 inserts a pill where the caret was before focus left, keeping the text, then focuses the text box', async () => {
    const { user, handle, insert, onChange } = renderComposer();
    await user.click(box());
    await user.keyboard('Please review first');
    await placeCaret(user, 'Please review'.length);
    await user.tab();
    expect(box()).not.toHaveFocus();
    expect(insert()).toBe('inserted');
    expect(box()).toHaveFocus();
    const draft = {
      text: 'Please review @Ana Lopez first',
      tokens: [{ ...ana, start: 14, end: 24 }],
    };
    expect(onChange).toHaveBeenLastCalledWith(draft);
    expect(handle.current?.getDraft()).toEqual(draft);
    // Typing goes on after the pill and its space.
    await user.keyboard('and');
    expect(handle.current?.getDraft().text).toBe('Please review @Ana Lopez andfirst');
  });

  it('UIC-MESSAGE-COMPOSER-4.10 inserts at the end of the draft when the text box has had no caret, and separates the pill from a word', () => {
    const { insert, handle } = renderComposer({
      defaultValue: { text: 'Look at', tokens: [] },
    });
    expect(insert()).toBe('inserted');
    expect(insert({ kind: 'mention', id: 'jon', label: 'Jon Berg' })).toBe('inserted');
    expect(handle.current?.getDraft()).toEqual({
      text: 'Look at @Ana Lopez @Jon Berg ',
      tokens: [
        { ...ana, start: 8, end: 18 },
        { kind: 'mention', id: 'jon', label: 'Jon Berg', start: 19, end: 28 },
      ],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.10 keeps a selection and inserts after it, and goes on a new line after a code block', async () => {
    const { user, insert, handle } = renderComposer();
    await user.click(box());
    await user.keyboard('Hello{Control>}a{/Control}');
    insert();
    expect(handle.current?.getDraft().text).toBe('Hello @Ana Lopez ');
    await user.keyboard('{Shift>}{Enter}{/Shift}```const a = 1');
    insert();
    expect(handle.current?.getDraft()).toEqual({
      text: 'Hello @Ana Lopez \n```\nconst a = 1\n```\n@Ana Lopez ',
      tokens: [
        { ...ana, start: 6, end: 16 },
        { ...ana, start: 38, end: 48 },
      ],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.10 makes the insertion one undo step of its own', async () => {
    const { user, insert, handle } = renderComposer();
    await user.click(box());
    await user.keyboard('Hello');
    insert();
    expect(handle.current?.getDraft().text).toBe('Hello @Ana Lopez ');
    await user.keyboard('{Control>}z{/Control}');
    expect(handle.current?.getDraft()).toEqual({ text: 'Hello', tokens: [] });
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(handle.current?.getDraft().tokens).toEqual([{ ...ana, start: 6, end: 16 }]);
  });

  it('UIC-MESSAGE-COMPOSER-4.10 reports a removed pill and inserts it again', async () => {
    const { user, insert, onChange } = renderComposer({
      defaultValue: { text: 'See @Ana Lopez', tokens: [{ ...ana, start: 4, end: 14 }] },
    });
    // Focus from the keyboard keeps the caret where the composer put it: after the pill.
    await user.tab();
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith({ text: 'See ', tokens: [] });
    expect(insert()).toBe('inserted');
    expect(onChange).toHaveBeenLastCalledWith({
      text: 'See @Ana Lopez ',
      tokens: [{ ...ana, start: 4, end: 14 }],
    });
  });

  it('UIC-MESSAGE-COMPOSER-4.10 refuses while disabled or editing, and reads the draft under an edit and what the text box shows', () => {
    const draft = { text: 'Draft', tokens: [] };
    const { insert, handle, rerender, onChange } = renderComposer({
      defaultValue: draft,
      isDisabled: true,
    });
    expect(insert()).toBe('disabled');
    rerender(
      <RichMessageComposer
        handleRef={handle}
        defaultValue={draft}
        onChange={onChange}
        editValue={{ text: 'Sent earlier', tokens: [] }}
      />,
    );
    expect(insert()).toBe('editing');
    expect(handle.current?.getDraft()).toEqual(draft);
    expect(handle.current?.getValue()).toEqual({ text: 'Sent earlier', tokens: [] });
    expect(onChange).not.toHaveBeenCalled();
    rerender(<RichMessageComposer handleRef={handle} defaultValue={draft} onChange={onChange} />);
    expect(handle.current?.getValue()).toEqual(draft);
  });

  it('UIC-MESSAGE-COMPOSER-4.10 refuses while a sent message waits, inserts while a reply runs, and reads a stored draft', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'draft',
      JSON.stringify({ text: '@Ana Lopez ', tokens: [{ ...ana, start: 0, end: 10 }] }),
    );
    let accept: () => void = () => undefined;
    const user = userEvent.setup();
    const handle = createRef<MessageComposerHandle>();
    const onSubmit = () =>
      new Promise<void>((resolve) => {
        accept = resolve;
      });
    const { rerender } = render(
      <UiProvider storage={storage}>
        <RichMessageComposer handleRef={handle} persistKey="draft" onSubmit={onSubmit} />
      </UiProvider>,
    );
    expect(handle.current?.getDraft().tokens).toEqual([{ ...ana, start: 0, end: 10 }]);
    await user.click(box());
    await user.keyboard('{Enter}');
    let result: string | undefined;
    act(() => {
      result = handle.current?.insertToken(ana);
    });
    expect(result).toBe('submitting');
    await act(async () => accept());
    expect(handle.current?.getDraft()).toEqual({ text: '', tokens: [] });
    rerender(
      <UiProvider storage={storage}>
        <RichMessageComposer handleRef={handle} persistKey="draft" isPending onStop={vi.fn()} />
      </UiProvider>,
    );
    act(() => {
      result = handle.current?.insertToken(ana);
    });
    expect(result).toBe('inserted');
  });
});
