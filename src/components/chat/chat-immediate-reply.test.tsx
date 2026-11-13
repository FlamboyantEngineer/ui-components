import { act, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { article, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import type { ChatComposerHandle, ChatProps } from './chat.js';

installEditorDom();
const platformChoice = vi.hoisted(() => ({ value: 'windows' as 'mac' | 'windows' }));
vi.mock(import('../shortcut/shortcut-format.js'), async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getShortcutPlatform: () => platformChoice.value,
    formatAriaKeyShortcuts: (chord: Parameters<typeof original.formatAriaKeyShortcuts>[0]) =>
      original.formatAriaKeyShortcuts(chord, platformChoice.value),
  };
});
afterEach(() => vi.restoreAllMocks());
const box = () => screen.getByRole('textbox', { name: 'Message' });

describe('Immediate replies', () => {
  it('UIC-CHAT-3.7 preserves quoted text and tokens exactly once through immediate acceptance', async () => {
    const composerHandleRef = createRef<ChatComposerHandle>();
    const onSendNow = vi.fn();
    const { user } = renderChat({
      isPending: true,
      onQueueChange: vi.fn(),
      onSendNow,
      composerHandleRef,
    });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    act(() => {
      composerHandleRef.current?.insertToken({
        kind: 'reference',
        id: 'note-4',
        label: 'NOTE-4',
        recordType: 'note',
      });
    });
    const draft = composerHandleRef.current?.getDraft();
    expect(draft?.tokens).toHaveLength(1);
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSendNow).toHaveBeenCalledExactlyOnceWith(draft?.text, draft?.tokens, 'm1');
  });

  it.each([
    ['Win32', '{Control>}{Enter}{/Control}', false],
    ['MacIntel', '{Meta>}{Enter}{/Meta}', false],
    ['Win32', '{Enter}', true],
  ] as const)(
    'UIC-CHAT-3.7 UIC-CHAT-3.14 preserves the quote once on %s with automatic steering %s',
    async (platform, chord, steersWhilePending) => {
      platformChoice.value = platform === 'MacIntel' ? 'mac' : 'windows';
      const onSendNow = vi.fn();
      const { user, container, onReply, onSend } = renderChat({
        isPending: true,
        onQueueChange: vi.fn(),
        onSendNow,
        steersWhilePending,
      });
      await user.hover(article('m1'));
      await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
      await user.keyboard(`Keep the quote${chord}`);
      expect(onSendNow).toHaveBeenCalledExactlyOnceWith('Keep the quote', [], 'm1');
      expect(onSend).not.toHaveBeenCalled();
      expect(onReply).not.toHaveBeenCalled();
      expect(box()).toHaveTextContent('');
      expect(container.querySelector('.ui-chat__banner')).toBeNull();
    },
  );

  it('UIC-CHAT-3.7 preserves text and quote on asynchronous refusal', async () => {
    const failure = new Error('Refused');
    const onSendError = vi.fn();
    const { user, container } = renderChat({
      isPending: true,
      onQueueChange: vi.fn(),
      onSendNow: vi.fn().mockRejectedValue(failure),
      onSendError,
    });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await user.keyboard('Keep this{Control>}{Enter}{/Control}');
    expect(onSendError).toHaveBeenCalledWith(failure);
    expect(box()).toHaveTextContent('Keep this');
    expect(container.querySelector('.ui-chat__banner')).not.toBeNull();
  });

  it('UIC-CHAT-3.7 keeps a later draft and quote while delivery settles, including across conversations', async () => {
    let accept: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      accept = resolve;
    });
    const options: Partial<ChatProps> = {
      conversationId: 'immediate-draft-first',
      isPending: true,
      onQueueChange: vi.fn(),
      onSendNow: () => pending,
    };
    const { user, container, rerenderWith } = renderChat(options);
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await user.keyboard('First{Control>}{Enter}{/Control} then more');
    await act(async () => accept());
    expect(box()).toHaveTextContent('First then more');
    expect(container.querySelector('.ui-chat__banner')).not.toBeNull();
    rerenderWith({ ...options, conversationId: 'immediate-draft-second' });
    expect(container.querySelector('.ui-chat__banner')).toBeNull();
  });

  it('UIC-CHAT-3.7 preserves a new conversation draft when a quoted immediate acceptance arrives late', async () => {
    let accept: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      accept = resolve;
    });
    const onSendNow = vi.fn(() => pending);
    const options: Partial<ChatProps> = {
      conversationId: 'immediate-switch-first',
      isPending: true,
      onQueueChange: vi.fn(),
      onSendNow,
    };
    const { user, rerenderWith, container } = renderChat(options);
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await user.keyboard('First{Control>}{Enter}{/Control}');
    rerenderWith({ ...options, conversationId: 'immediate-switch-second' });
    await user.click(box());
    await user.keyboard('Another draft');
    await act(async () => accept());
    expect(onSendNow).toHaveBeenCalledExactlyOnceWith('First', [], 'm1');
    expect(box()).toHaveTextContent('Another draft');
    expect(container.querySelector('.ui-chat__banner')).toBeNull();
  });
});
