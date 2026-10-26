import { describe, expect, it, vi } from 'vitest';
import { helper, message, people } from '../../../test/chat-fixtures.js';
import { toMessageCommands, type ChatCommandContext } from './chat-commands.js';
import { indexParticipants } from './chat-model.js';

/** A context with every handler, recording their calls. */
function createContext(overrides: Partial<ChatCommandContext> = {}) {
  const handlers = {
    copy: vi.fn(),
    feedback: vi.fn(),
    reply: vi.fn(),
    react: vi.fn(),
    edit: vi.fn(),
    delete: vi.fn(),
  };
  const context: ChatCommandContext = {
    handlers,
    currentUserId: 'sam',
    isAssistantChat: false,
    participants: indexParticipants([...people, helper]),
    feedbackReasons: ['Accurate'],
    ...overrides,
  };
  return { context, handlers };
}

const offered = (commands: object) =>
  Object.entries(commands)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key)
    .sort();

describe('message commands', () => {
  it('UIC-CHAT-2.1 offers Reply, React, Edit and Delete between people, the last two on own messages', () => {
    const { context } = createContext();
    expect(offered(toMessageCommands(message('a', 'sam'), context))).toEqual([
      'copyText',
      'onCopy',
      'onDelete',
      'onEdit',
      'onReact',
      'onReply',
    ]);
    expect(offered(toMessageCommands(message('b', 'ana'), context))).toEqual([
      'copyText',
      'onCopy',
      'onReact',
      'onReply',
    ]);
    const filesOnly = { ...message('c', 'sam'), parts: [] };
    expect(offered(toMessageCommands(filesOnly, context))).toEqual([
      'onDelete',
      'onReact',
      'onReply',
    ]);
  });

  it('UIC-CHAT-2.1 offers nothing on a deleted message or a notice, and only what has a callback', () => {
    const { context } = createContext();
    expect(toMessageCommands(message('d', 'ana', { isDeleted: true }), context)).toEqual({});
    expect(toMessageCommands(message('n', undefined), context)).toEqual({});
    const bare = createContext({ handlers: {} }).context;
    expect(toMessageCommands(message('a', 'sam'), bare)).toEqual({});
  });

  it('UIC-CHAT-2.1 UIC-CHAT-2.2 offers Copy and the ratings on a finished assistant reply only', () => {
    const { context, handlers } = createContext({ isAssistantChat: true });
    const reply = message('r', 'helper', { feedback: 'up' });
    const commands = toMessageCommands(reply, context);
    expect(offered(commands)).toEqual([
      'copyText',
      'feedback',
      'feedbackReasons',
      'onCopy',
      'onFeedback',
      'onReply',
    ]);
    expect(commands.copyText).toBe('Text of r');
    commands.onCopy?.();
    commands.onFeedback?.({ rating: 'down', reasons: ['Accurate'] });
    expect(handlers.copy).toHaveBeenCalledWith('r');
    expect(handlers.feedback).toHaveBeenCalledWith('r', { rating: 'down', reasons: ['Accurate'] });
    expect(offered(toMessageCommands(message('s', 'sam'), context))).toEqual([
      'copyText',
      'onCopy',
      'onReply',
    ]);
    expect(toMessageCommands({ ...reply, status: 'streaming' }, context)).toEqual({});
  });

  it('UIC-CHAT-2.1 UIC-CHAT-2.4 quotes finished messages with text in an assistant chat, and no more', () => {
    const { context, handlers } = createContext({ isAssistantChat: true });
    const own = toMessageCommands(message('s', 'sam'), context);
    own.onReply?.();
    expect(handlers.reply).toHaveBeenCalledWith('s');
    expect(own).not.toHaveProperty('onEdit');
    expect(own).not.toHaveProperty('onDelete');
    expect(own).not.toHaveProperty('onReact');
    const filesOnly = { ...message('f', 'sam'), parts: [] };
    expect(toMessageCommands(filesOnly, context)).toEqual({});
    for (const status of ['streaming', 'error', 'cancelled'] as const) {
      const unfinished = message('u', 'helper', { status });
      expect(toMessageCommands(unfinished, context)).not.toHaveProperty('onReply');
    }
    const withoutReply = createContext({ isAssistantChat: true, handlers: { copy: vi.fn() } });
    expect(toMessageCommands(message('s', 'sam'), withoutReply.context)).not.toHaveProperty(
      'onReply',
    );
  });

  it('UIC-CHAT-2.3 UIC-CHAT-2.5 UIC-CHAT-2.6 binds the commands to the message', () => {
    const { context, handlers } = createContext();
    const liked = message('a', 'sam', { reactions: [{ emoji: '👍', isReacted: true }] });
    const commands = toMessageCommands(liked, context);
    commands.onReact?.('👍');
    commands.onReact?.('🎉');
    commands.onReply?.();
    commands.onEdit?.();
    void commands.onDelete?.();
    expect(handlers.react.mock.calls).toEqual([
      ['a', '👍', false],
      ['a', '🎉', true],
    ]);
    expect(handlers.reply).toHaveBeenCalledWith('a');
    expect(handlers.edit).toHaveBeenCalledWith('a');
    expect(handlers.delete).toHaveBeenCalledWith('a');
  });
});
