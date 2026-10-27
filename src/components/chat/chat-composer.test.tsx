import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  TestChat,
  article,
  assistantPeople,
  message,
  renderChat,
} from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { ChatModelPicker } from '../chat-model-picker/chat-model-picker.js';
import { MessageComposerMenuButton } from '../message-composer/index.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const ana = { kind: 'mention', id: 'ana' } as const;

describe('Chat composer', () => {
  it('UIC-CHAT-3.1 UIC-CHAT-3.2 sends the text with its tokens labelled as their pills show', async () => {
    const { user, onSend, container } = renderChat({ placeholder: 'Message the group' });
    expect(container.querySelector('.ui-chat__composer')).toHaveClass('ui-message-composer');
    expect(box()).toHaveAttribute('aria-placeholder', 'Message the group');
    await user.click(box());
    await user.keyboard('@an{Enter}see you{Enter}');
    expect(onSend).toHaveBeenCalledWith('@Ana Lopez see you', [
      { start: 0, end: 10, ...ana, label: '@Ana Lopez' },
    ]);
  });

  it('UIC-CHAT-3.1 has no composer without onSend, offers emoji between people, and waits while disabled', () => {
    const { container, rerenderWith } = renderChat({ onSend: undefined });
    expect(container.querySelector('.ui-message-composer')).toBeNull();
    rerenderWith({});
    expect(screen.getByRole('button', { name: 'Insert emoji' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Attach files' })).not.toBeInTheDocument();
    rerenderWith({ participants: assistantPeople, isDisabled: true });
    expect(screen.queryByRole('button', { name: 'Insert emoji' })).not.toBeInTheDocument();
    expect(box()).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-CHAT-3.1 keeps a draft per conversation in the provider storage', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const { rerender } = render(
      <UiProvider storage={storage}>
        <TestChat conversationId="trip" onSend={() => undefined} />
      </UiProvider>,
    );
    await user.click(box());
    await user.keyboard('Half packed');
    expect(JSON.parse(storage.getItem('chat-draft:trip') ?? '')).toEqual({
      text: 'Half packed',
      tokens: [],
    });
    rerender(
      <UiProvider storage={storage}>
        <TestChat conversationId="other" onSend={() => undefined} />
      </UiProvider>,
    );
    expect(box()).toHaveTextContent('');
  });

  it('UIC-CHAT-3.1 offers Stop while a reply is pending', async () => {
    const onStop = vi.fn();
    const { user } = renderChat({ participants: assistantPeople, isPending: true, onStop });
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-2.4 replies to a message from its banner, and Escape cancels the reply', async () => {
    const { user, onReply, onSend, container } = renderChat();
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    const banner = container.querySelector('.ui-chat__banner') as HTMLElement;
    expect(banner).toHaveTextContent('Replying to');
    expect(within(banner).getByText('Ana Lopez')).toBeVisible();
    await waitFor(() => expect(box()).toHaveFocus());
    expect(box()).toHaveAccessibleDescription(/Replying to Ana Lopez/);
    await user.keyboard('Still on!{Enter}');
    expect(onReply).toHaveBeenCalledWith('m1', 'Still on!', []);
    expect(container.querySelector('.ui-chat__banner')).toBeNull();
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(container.querySelector('.ui-chat__banner')).toBeNull();
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await user.click(screen.getByRole('button', { name: 'Cancel reply' }));
    await user.click(box());
    await user.keyboard('New{Enter}');
    expect(onSend).toHaveBeenCalledWith('New', []);
  });

  it('UIC-CHAT-2.4 shows the quote of a reply and jumps to the message it answers', async () => {
    const reply = message('m4', 'ana', { text: 'Gate B', replyTo: 'm2' });
    const { user, rerenderWith } = renderChat({ messages: [message('m2', 'sam'), reply] });
    const quote = within(article('m4')).getByRole('button', { name: /^Quote from Sam Reed/ });
    await user.click(quote);
    expect(article('m2')).toHaveAttribute('data-highlighted', 'true');
    await waitFor(() => expect(article('m2')).toHaveFocus());
    rerenderWith({ messages: [reply] });
    expect(article('m4').querySelector('.ui-chat-quote')).toBeNull();
  });

  it('UIC-CHAT-2.5 UIC-CHAT-3.3 edits the last own message with Up and saves through onEdit', async () => {
    const own = message('o1', 'sam', { text: 'See you at nine' });
    const { user, onEdit, container } = renderChat({ messages: [message('a', 'ana'), own] });
    await user.click(box());
    await user.keyboard('{ArrowUp}');
    expect(container.querySelector('.ui-chat__banner')).toHaveTextContent('Editing your message');
    expect(box()).toHaveTextContent('See you at nine');
    await user.keyboard('!{Enter}');
    expect(onEdit).toHaveBeenCalledWith('o1', 'See you at nine!', []);
    expect(container.querySelector('.ui-chat__banner')).toBeNull();
  });

  it('UIC-CHAT-3.10 UIC-CHAT-3.2 draws references from getReference and sends and edits them by id', async () => {
    const trip = {
      kind: 'reference',
      id: 'trip-uuid',
      label: 'TRIP-4',
      recordType: 'trip',
    } as const;
    const note = { kind: 'reference', id: 'note-uuid', label: 'NOTE-12' } as const;
    const own = message('r1', 'sam');
    own.parts = [{ type: 'text', text: 'Review TRIP-4', tokens: [{ start: 7, end: 13, ...trip }] }];
    const getReference = (reference: { id: string }) =>
      reference.id === 'trip-uuid' ? { name: 'Lisbon weekend', href: '/trips/4' } : undefined;
    const menu = (
      <MessageComposerMenuButton
        sections={[
          {
            id: 'references',
            title: 'References',
            items: [
              {
                id: 'note',
                label: 'Reference NOTE-12',
                onAction: (composer) => composer.insertPill(note),
              },
            ],
          },
        ]}
      />
    );
    const { user, onEdit, onSend } = renderChat({
      messages: [message('a', 'ana'), own],
      getReference,
      composerStartControls: menu,
    });
    expect(
      within(article('r1')).getByRole('link', { name: 'TRIP-4 Lisbon weekend' }),
    ).toHaveAttribute('href', '/trips/4');
    await user.click(box());
    await user.keyboard('{ArrowUp}');
    expect(within(box()).getByRole('link', { name: 'TRIP-4 Lisbon weekend' })).toBeVisible();
    await user.keyboard('!{Enter}');
    expect(onEdit).toHaveBeenCalledWith('r1', 'Review TRIP-4!', [{ start: 7, end: 13, ...trip }]);
    await user.click(screen.getByRole('button', { name: 'Add and more' }));
    await user.click(
      within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Reference NOTE-12' }),
    );
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('NOTE-12 ', [{ start: 0, end: 7, ...note }]);
  });

  it('UIC-CHAT-2.5 edits from the action and Escape leaves the edit', async () => {
    const own = message('o2', 'sam', { text: 'Bring tea' });
    const { user, onEdit, container } = renderChat({ messages: [own] });
    await user.hover(article('o2'));
    await user.click(within(article('o2')).getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(box()).toHaveFocus());
    expect(box()).toHaveTextContent('Bring tea');
    await user.keyboard('{Escape}');
    expect(container.querySelector('.ui-chat__banner')).toBeNull();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-3.3 recalls earlier prompts in an assistant chat', async () => {
    const { user } = renderChat({ participants: assistantPeople, history: ['Plan a trip'] });
    await user.click(box());
    await user.keyboard('{ArrowUp}');
    expect(box()).toHaveTextContent('Plan a trip');
  });

  it('UIC-CHAT-3.4 lists the queue, edits a queued message in the composer and removes one', async () => {
    const onQueueChange = vi.fn();
    const queue = [
      { id: 'q1', text: 'And lunch?' },
      { id: 'q2', text: 'And dinner?' },
    ];
    const { user, container } = renderChat({
      participants: assistantPeople,
      isPending: true,
      onStop: () => undefined,
      queue,
      onQueueChange,
    });
    const list = screen.getByRole('list', { name: '2 queued messages' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['And lunch?', 'And dinner?']);
    await user.click(screen.getByRole('button', { name: 'Edit queued message 1' }));
    expect(container.querySelector('.ui-chat__queue-item')).toHaveAttribute('data-editing', 'true');
    expect(container.querySelector('.ui-chat__banner')).toHaveTextContent(
      'Editing a queued message',
    );
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard(' Soup{Enter}');
    expect(onQueueChange).toHaveBeenLastCalledWith([
      { ...queue[0], text: 'And lunch? Soup', tokens: [] },
      queue[1],
    ]);
    await user.click(screen.getByRole('button', { name: 'Remove queued message 2' }));
    expect(onQueueChange).toHaveBeenLastCalledWith([queue[0]]);
  });

  it('UIC-CHAT-3.4 keeps focus in the queue as messages are removed, then moves it to the composer', async () => {
    const user = userEvent.setup();
    function QueueHost() {
      const [queue, setQueue] = useState<readonly ChatQueuedMessage[]>([
        { id: 'q1', text: 'First' },
        { id: 'q2', text: 'Second' },
      ]);
      return (
        <TestChat
          participants={assistantPeople}
          onSend={() => undefined}
          queue={queue}
          onQueueChange={setQueue}
        />
      );
    }
    render(<QueueHost />);
    await user.click(screen.getByRole('button', { name: 'Remove queued message 1' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove queued message 1' })).toHaveFocus(),
    );
    await user.keyboard('{Enter}');
    await waitFor(() => expect(box()).toHaveFocus());
    expect(screen.queryByRole('list', { name: /queued/ })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-3.4 sends while a reply is pending when the host queues', async () => {
    const { user, onSend } = renderChat({
      participants: assistantPeople,
      isPending: true,
      onStop: () => undefined,
      queue: [],
      onQueueChange: () => undefined,
    });
    await user.click(box());
    await user.keyboard('Then dessert{Enter}');
    expect(onSend).toHaveBeenCalledWith('Then dessert', []);
  });

  it('UIC-CHAT-3.5 attaches files and lists the next message’s files with Remove and Retry', async () => {
    const onAttach = vi.fn();
    const onRemoveAttachment = vi.fn();
    const onRetryAttachment = vi.fn();
    const { user, onSend } = renderChat({
      participants: assistantPeople,
      onAttach,
      onRemoveAttachment,
      onRetryAttachment,
      attachments: [
        { id: 'f1', name: 'map.pdf', mediaType: 'application/pdf', status: 'complete' },
        { id: 'f2', name: 'photo.jpg', mediaType: 'image/jpeg', status: 'error' },
      ],
    });
    expect(screen.getByRole('button', { name: 'Attach files' })).toBeVisible();
    const files = screen.getByRole('list', { name: 'Attachments' });
    await user.click(within(files).getByRole('button', { name: 'Retry' }));
    await user.click(within(files).getByRole('button', { name: 'Remove map.pdf' }));
    expect(onRetryAttachment).toHaveBeenCalledWith('f2');
    expect(onRemoveAttachment).toHaveBeenCalledWith('f1');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('', []);
  });

  it('UIC-CHAT-3.6 disables a model picker among the composer controls with the chat', async () => {
    const onModelChange = vi.fn();
    const models = [
      { id: 'swift', label: 'Swift', efforts: [] },
      { id: 'deep', label: 'Deep' },
    ];
    const picker = (isDisabled?: boolean) => (
      <ChatModelPicker models={models} onModelChange={onModelChange} isDisabled={isDisabled} />
    );
    const { user, container, rerenderWith } = renderChat({ composerEndControls: picker() });
    const end = container.querySelector('.ui-message-composer__end') as HTMLElement;
    const controls = within(end).getAllByRole('button');
    expect(controls.map((control) => control.getAttribute('aria-label'))).toEqual([
      'Model: Swift',
      'Send',
    ]);
    await user.click(controls[0] as HTMLElement);
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitemradio', { name: 'Deep' }));
    expect(onModelChange).toHaveBeenCalledWith('deep');
    rerenderWith({ composerEndControls: picker(), isDisabled: true });
    expect(screen.getByRole('button', { name: /^Model:/ })).toBeDisabled();
    rerenderWith({ composerEndControls: picker(true) });
    expect(screen.getByRole('button', { name: /^Model:/ })).toBeDisabled();
  });

  it('UIC-CHAT-3.9 runs a + menu among the composer controls on the chat composer, disabled with it', async () => {
    const onSelectedChange = vi.fn();
    const menuButton = (
      <MessageComposerMenuButton
        sections={[
          {
            id: 'add',
            title: 'Add',
            items: [
              {
                id: 'goal',
                label: 'Insert a goal prompt',
                onAction: (composer) => composer.insertText('Goal: a calm weekend'),
              },
              { id: 'plan', label: 'Plan mode', isSelected: false, onSelectedChange },
            ],
          },
        ]}
      />
    );
    const { user, onSend, rerenderWith } = renderChat({ composerStartControls: menuButton });
    await user.click(screen.getByRole('button', { name: 'Add and more' }));
    const menu = await screen.findByRole('menu', { name: 'Add and more' });
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Plan mode' }));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    await user.click(within(menu).getByRole('menuitem', { name: 'Insert a goal prompt' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Goal: a calm weekend', []);
    rerenderWith({ composerStartControls: menuButton, isDisabled: true });
    expect(screen.getByRole('button', { name: 'Add and more' })).toBeDisabled();
  });
});
