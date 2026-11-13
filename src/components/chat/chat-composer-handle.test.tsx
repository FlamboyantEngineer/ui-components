import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type RefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { article, assistantPeople, message, TestChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { PlusGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { Button } from '../button/button.js';
import type { ChatComposerHandle, ChatDraft, ChatProps } from './chat.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const ana = { kind: 'mention', id: 'ana', label: '@Ana Lopez' } as const;

const assistantChat: ChatProps['messages'] = [
  message('q1', 'sam', { text: 'Which trains run on Sunday?' }),
  message('a1', 'helper', { text: 'The 9:15 and the 11:40.' }),
];

/** A promise the test settles. */
function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

/** A chat beside a host's "+" button that adds Ana to the shown conversation's draft. */
function HostChat({
  handle,
  ...props
}: Partial<ChatProps> & { handle: RefObject<ChatComposerHandle | null> }) {
  return (
    <>
      <Button
        label="Add Ana"
        icon={PlusGlyph}
        onPress={() => handle.current?.insertToken(ana, { conversationId: props.conversationId })}
      />
      <TestChat
        participants={assistantPeople}
        messages={assistantChat}
        composerHandleRef={handle}
        {...props}
      />
    </>
  );
}

function renderHostChat(props: Partial<ChatProps> = {}) {
  const user = userEvent.setup();
  const handle = createRef<ChatComposerHandle>();
  const onSend = vi.fn<NonNullable<ChatProps['onSend']>>();
  const onDraftChange = vi.fn<(draft: ChatDraft) => void>();
  const all = { handle, onSend, onDraftChange, conversationId: 'trip', ...props };
  const view = render(<HostChat {...all} />);
  const rerenderWith = (next: Partial<ChatProps>) => view.rerender(<HostChat {...all} {...next} />);
  return { ...view, user, handle, onSend, onDraftChange, rerenderWith };
}

describe('Chat composer handle', () => {
  it('UIC-CHAT-3.11 inserts a token from a host button pressed from the keyboard, keeps the typed text and focuses the composer', async () => {
    const { user, onSend, onDraftChange } = renderHostChat();
    await user.click(box());
    await user.keyboard('Ask');
    await user.click(document.body);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Add Ana' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(box()).toHaveFocus();
    const tokens = [{ ...ana, start: 4, end: 14 }];
    expect(onDraftChange).toHaveBeenLastCalledWith({
      conversationId: 'trip',
      text: 'Ask @Ana Lopez ',
      tokens,
    });
    await user.keyboard('about Sunday{Enter}');
    expect(onSend).toHaveBeenCalledWith('Ask @Ana Lopez about Sunday', tokens);
  });

  it('UIC-CHAT-3.11 inserts record references, sent alone with their identity', async () => {
    const { user, handle, onSend } = renderHostChat();
    const trip = {
      kind: 'reference',
      id: 'rec-4',
      label: 'TRIP-4',
      recordType: 'itinerary',
    } as const;
    const note = { kind: 'reference', id: 'rec-12', label: 'NOTE-12', recordType: 'note' } as const;
    act(() => {
      handle.current?.insertToken(trip);
      handle.current?.insertToken(note);
    });
    expect(
      box().querySelectorAll('.ui-message-composer__pill[data-kind="reference"]'),
    ).toHaveLength(2);
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('TRIP-4 NOTE-12 ', [
      { ...trip, start: 0, end: 6 },
      { ...note, start: 7, end: 14 },
    ]);
  });

  it('UIC-CHAT-3.11 reports the draft as it loads and as pills come and go, so the host can skip a token already there', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'chat-draft:trip',
      JSON.stringify({
        text: '@Ana Lopez ',
        tokens: [{ ...ana, label: 'Ana Lopez', start: 0, end: 10 }],
      }),
    );
    const handle = createRef<ChatComposerHandle>();
    const onDraftChange = vi.fn<(draft: ChatDraft) => void>();
    const user = userEvent.setup();
    const chat = (conversationId: string) => (
      <UiProvider storage={storage}>
        <HostChat
          handle={handle}
          conversationId={conversationId}
          onSend={vi.fn()}
          onDraftChange={onDraftChange}
        />
      </UiProvider>
    );
    const { rerender } = render(chat('trip'));
    const loaded = {
      conversationId: 'trip',
      text: '@Ana Lopez ',
      tokens: [{ ...ana, start: 0, end: 10 }],
    };
    expect(onDraftChange).toHaveBeenLastCalledWith(loaded);
    expect(handle.current?.getDraft()).toEqual(loaded);
    // The host skips a token the draft holds; another conversation's draft does not hold it.
    const hasAna = () => handle.current?.getDraft().tokens.some((token) => token.id === 'ana');
    expect(hasAna()).toBe(true);
    rerender(chat('hotel'));
    expect(onDraftChange).toHaveBeenLastCalledWith({
      conversationId: 'hotel',
      text: '',
      tokens: [],
    });
    expect(hasAna()).toBe(false);
    rerender(chat('trip'));
    await user.click(box());
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    expect(onDraftChange).toHaveBeenLastCalledWith({
      conversationId: 'trip',
      text: '',
      tokens: [],
    });
    expect(hasAna()).toBe(false);
  });

  it('UIC-CHAT-3.11 refuses a handle or a request made for another conversation', () => {
    const { handle, rerenderWith } = renderHostChat();
    const tripHandle = handle.current;
    rerenderWith({ conversationId: 'hotel' });
    let results: string[] = [];
    act(() => {
      results = [
        tripHandle?.insertToken(ana) ?? '',
        handle.current?.insertToken(ana, { conversationId: 'trip' }) ?? '',
      ];
    });
    expect(results).toEqual(['other-conversation', 'other-conversation']);
    expect(handle.current?.getDraft()).toEqual({ conversationId: 'hotel', text: '', tokens: [] });
    act(() => {
      results = [handle.current?.insertToken(ana) ?? ''];
    });
    expect(results).toEqual(['inserted']);
  });

  it('UIC-CHAT-3.11 UIC-CHAT-3.7 refuses while a message waits for acceptance and keeps text, tokens and quote when it is rejected', async () => {
    const sending = deferred();
    const onReply = vi.fn(() => sending.promise);
    const { user, container, handle } = renderHostChat({
      onReply,
      onSendError: vi.fn(),
      onSend: vi.fn(),
    });
    await user.hover(article('a1'));
    await user.click(within(article('a1')).getByRole('button', { name: 'Reply' }));
    await user.click(screen.getByRole('button', { name: 'Add Ana' }));
    await user.keyboard('is it direct?{Enter}');
    expect(onReply).toHaveBeenCalledWith('a1', '@Ana Lopez is it direct?', [
      { ...ana, start: 0, end: 10 },
    ]);
    await user.click(screen.getByRole('button', { name: 'Add Ana' }));
    let result: string | undefined;
    act(() => {
      result = handle.current?.insertToken(ana);
    });
    expect(result).toBe('submitting');
    await act(async () => sending.reject(new Error('Offline')));
    expect(container.querySelector('.ui-chat__banner')).toBeInTheDocument();
    expect(handle.current?.getDraft()).toEqual({
      conversationId: 'trip',
      text: '@Ana Lopez is it direct?',
      tokens: [{ ...ana, start: 0, end: 10 }],
    });
  });

  it('UIC-CHAT-3.11 inserts while a reply runs, and refuses while disabled, editing or without a composer', async () => {
    const { user, handle, rerenderWith } = renderHostChat({
      isPending: true,
      onStop: vi.fn(),
      onSend: vi.fn(),
      queue: [{ id: 'later', text: 'And on Monday?' }],
      onQueueChange: vi.fn(),
    });
    const insert = () => {
      let result: string | undefined;
      act(() => {
        result = handle.current?.insertToken(ana);
      });
      return result;
    };
    expect(insert()).toBe('inserted');
    await user.click(screen.getByRole('button', { name: 'Actions for queued message 1' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit queued message 1' }));
    expect(insert()).toBe('editing');
    rerenderWith({ isDisabled: true, onSend: vi.fn() });
    expect(insert()).toBe('disabled');
    rerenderWith({ onSend: undefined });
    expect(insert()).toBe('unavailable');
  });

  it('UIC-CHAT-3.12 reads and replaces the composer selection for the shown conversation only, and forwards the composer id, paste and triggers', async () => {
    const onComposerPaste = vi.fn(() => undefined);
    const onComposerSelectionChange = vi.fn();
    const { user, handle, rerenderWith } = renderHostChat({
      conversationId: 'plans',
      composerInputId: 'chat-input',
      onComposerPaste,
      onComposerSelectionChange,
      triggers: [{ id: 'tools', character: '$', getCompletions: () => [] }],
    });
    expect(box()).toHaveAttribute('id', 'chat-input');
    await user.click(box());
    await user.keyboard('Plan the day');
    expect(onComposerSelectionChange).toHaveBeenLastCalledWith({ start: 12, end: 12 });
    let result: string | undefined;
    act(() => {
      handle.current?.setSelection({ start: 5, end: 8 });
      result = handle.current?.replaceSelection({
        text: '@Ana Lopez',
        tokens: [{ ...ana, start: 0, end: 10 }],
      });
    });
    expect(result).toBe('applied');
    expect(handle.current?.getDraft()).toEqual({
      conversationId: 'plans',
      text: 'Plan @Ana Lopez day',
      tokens: [{ ...ana, start: 5, end: 15 }],
    });
    expect(handle.current?.getSelection()).toEqual({ start: 15, end: 15 });
    expect(handle.current?.getSelection({ conversationId: 'other' })).toBeNull();
    expect(
      handle.current?.replaceRange({ start: 0, end: 0 }, 'x', { conversationId: 'other' }),
    ).toBe('other-conversation');
    // A handle kept from before the chat switched serves its own conversation only.
    const stale = handle.current;
    rerenderWith({ conversationId: 'next' });
    expect(stale?.setSelection({ start: 0, end: 0 })).toBe('other-conversation');
  });
});
