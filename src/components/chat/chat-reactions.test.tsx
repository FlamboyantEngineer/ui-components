import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { push, renderController, textMessage } from '../../../test/chat-controller-fixtures.js';
import { article, assistantPeople, message, renderChat } from '../../../test/chat-fixtures.js';
import type { ChatMessageData } from './chat-parts.js';
import { setChatReaction, toReactionEntries } from './chat-reactions.js';

const question = textMessage('q1', 'ana', 'Plan a weekend');

describe('setChatReaction', () => {
  it('UIC-CHAT-2.3 adds, extends and takes back a participant reaction', () => {
    const added = setChatReaction([question], {
      messageId: 'q1',
      emoji: '👍',
      participantId: 'helper',
    });
    expect(added[0]?.reactions).toEqual([{ emoji: '👍', participantIds: ['helper'] }]);
    const both = setChatReaction(added, { messageId: 'q1', emoji: '👍', participantId: 'ben' });
    expect(both[0]?.reactions).toEqual([{ emoji: '👍', participantIds: ['helper', 'ben'] }]);
    const back = setChatReaction(both, {
      messageId: 'q1',
      emoji: '👍',
      participantId: 'helper',
      isReacted: false,
    });
    expect(back[0]?.reactions).toEqual([{ emoji: '👍', participantIds: ['ben'] }]);
    const gone = setChatReaction(back, {
      messageId: 'q1',
      emoji: '👍',
      participantId: 'ben',
      isReacted: false,
    });
    expect(gone[0]?.reactions).toEqual([]);
  });

  it('UIC-CHAT-2.3 keeps the conversation when nothing changes and steps an explicit count', () => {
    const counted: ChatMessageData = { ...question, reactions: [{ emoji: '🎉', count: 4 }] };
    const messages = [counted];
    const change = { messageId: 'q1', emoji: '🎉', participantId: 'helper' };
    expect(setChatReaction(messages, { ...change, isReacted: false })).toBe(messages);
    expect(setChatReaction(messages, { ...change, messageId: 'missing' })).toBe(messages);
    const once = setChatReaction(messages, change);
    expect(once[0]?.reactions).toEqual([{ emoji: '🎉', count: 5, participantIds: ['helper'] }]);
    expect(setChatReaction(once, change)).toBe(once);
    expect(messages[0]).toBe(counted);
  });

  it('UIC-CHAT-2.3 names and counts participants before people, and presses the reader', () => {
    const participants = new Map(assistantPeople.map((person) => [person.id, person]));
    const entries = toReactionEntries(
      [
        { emoji: '👍', participantIds: ['helper', 'sam'], people: ['Mia Chen'] },
        { emoji: '👀', participantIds: ['helper'] },
      ],
      { participants, currentUserId: 'sam' },
    );
    expect(entries).toEqual([
      { emoji: '👍', count: 3, isReacted: true, people: ['Trip helper', 'Sam Reed', 'Mia Chen'] },
      { emoji: '👀', count: 1, isReacted: false, people: ['Trip helper'] },
    ]);
  });
});

describe('agent reactions in the controller', () => {
  it('UIC-CHAT-12.8 writes a reaction event to the reader message the reply answers', async () => {
    const { result, at } = renderController();
    act(() => result.current.send('Plan a weekend'));
    const sentId = result.current.messages[0]?.id;
    await push(at(), { type: 'reaction', emoji: '👀' });
    expect(result.current.messages[0]?.reactions).toEqual([
      { emoji: '👀', participantIds: ['helper'] },
    ]);
    expect(result.current.messages[1]?.reactions).toBeUndefined();
    await push(
      at(),
      { type: 'text-delta', text: 'Done.' },
      { type: 'reaction', emoji: '👀', isReacted: false },
      { type: 'reaction', emoji: '👍', messageId: sentId },
      { type: 'finish' },
    );
    expect(result.current.messages[0]?.reactions).toEqual([
      { emoji: '👍', participantIds: ['helper'] },
    ]);
    expect(result.current.messages[1]).toMatchObject({
      status: 'complete',
      parts: [{ type: 'text', text: 'Done.', status: 'complete' }],
    });
  });

  it('UIC-CHAT-12.8 sets and takes back reactions imperatively, by the assistant by default', () => {
    const { result } = renderController({ initialMessages: [question] });
    act(() => result.current.setReaction({ messageId: 'q1', emoji: '🎉' }));
    act(() => result.current.setReaction({ messageId: 'q1', emoji: '🎉', participantId: 'ben' }));
    expect(result.current.messages[0]?.reactions).toEqual([
      { emoji: '🎉', participantIds: ['helper', 'ben'] },
    ]);
    const messages = result.current.messages;
    act(() => result.current.setReaction({ messageId: 'q1', emoji: '🎉', participantId: 'ben' }));
    expect(result.current.messages).toBe(messages);
    act(() => result.current.setReaction({ messageId: 'q1', emoji: '🎉', isReacted: false }));
    expect(result.current.messages[0]?.reactions).toEqual([
      { emoji: '🎉', participantIds: ['ben'] },
    ]);
  });
});

describe('agent reactions in a chat', () => {
  it('UIC-CHAT-2.3 names the assistant on its reaction, read-only in an assistant chat', () => {
    const asked = message('a1', 'sam', {
      reactions: [{ emoji: '👍', participantIds: ['helper'] }],
    });
    renderChat({ messages: [asked], participants: assistantPeople });
    const chip = within(article('a1')).getByRole('button', {
      name: '👍 1, reacted by Trip helper',
    });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Add reaction' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-2.3 presses the reader chip from participant ids and toggles it off', async () => {
    const liked = message('l1', 'ana', {
      reactions: [{ emoji: '👍', participantIds: ['ben', 'sam'] }],
    });
    const { user, onReact } = renderChat({ messages: [liked] });
    const chip = within(article('l1')).getByRole('button', {
      name: '👍 2, reacted by Ben Carter and Sam Reed',
    });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip);
    expect(onReact).toHaveBeenCalledWith('l1', '👍', false);
  });
});
