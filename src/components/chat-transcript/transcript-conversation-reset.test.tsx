import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getViewport,
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript } from './chat-transcript.js';
import { createTranscriptRegistry } from './transcript-registry.js';

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 400, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
});

const ana = { name: 'Ana Lima' };
const entry = {
  authorName: 'Ana Lima',
  summary: undefined,
  origin: 'received',
  status: 'complete',
  error: undefined,
} as const;

/** A message whose child key differs from its own id, as a host's wrapper gives it. */
function Wrapped({ messageId, children }: { messageId: string; children: ReactNode }) {
  return (
    <ChatMessage id={messageId} author={ana}>
      {children}
    </ChatMessage>
  );
}

const article = (text: string) =>
  screen.getAllByRole('article').find((element) => element.textContent?.includes(text));

describe('ChatTranscript conversation reset (UIC-CHAT-TRANSCRIPT-3.7)', () => {
  it('forgets the messages of earlier conversations, so a reused key can be a separator', () => {
    const { rerender } = render(
      <ChatTranscript aria-label="Conversation">
        <ChatMessage id="x" author={ana}>
          Old message
        </ChatMessage>
        <ChatMessage id="a2" author={ana}>
          Old reply
        </ChatMessage>
      </ChatTranscript>,
    );
    rerender(
      <ChatTranscript aria-label="Conversation">
        <ChatMessage id="b1" author={ana}>
          Between
        </ChatMessage>
      </ChatTranscript>,
    );
    rerender(
      <ChatTranscript aria-label="Conversation">
        <p key="x">Today</p>
        <ChatMessage id="c1" author={ana}>
          New message
        </ChatMessage>
        <ChatMessage id="c2" author={ana}>
          New reply
        </ChatMessage>
      </ChatTranscript>,
    );
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(article('New message')).toHaveAttribute('aria-posinset', '1');
    expect(article('New reply')).toHaveAttribute('aria-posinset', '2');
    expect(article('New reply')).toHaveAttribute('aria-setsize', '2');
  });

  it('forgets the ids messages registered in earlier conversations', () => {
    const { rerender } = render(
      <ChatTranscript aria-label="Conversation">
        <Wrapped key="w1" messageId="msg-1">
          Old message
        </Wrapped>
      </ChatTranscript>,
    );
    rerender(
      <ChatTranscript aria-label="Conversation">
        <ChatMessage id="b1" author={ana}>
          Between
        </ChatMessage>
      </ChatTranscript>,
    );
    rerender(
      <ChatTranscript aria-label="Conversation" highlightedMessageId="msg-1">
        <ChatMessage id="msg-1" author={ana}>
          New message
        </ChatMessage>
      </ChatTranscript>,
    );
    expect(article('New message')).toHaveAttribute('data-highlighted', 'true');
  });

  it('keeps a mounted message known by its own id, and drops the id it no longer has', () => {
    const registry = createTranscriptRegistry();
    registry.register('w1', { ...entry, id: 'msg-1' });
    registry.register('w2', { ...entry, id: 'msg-2' });
    registry.unregister('w2');
    expect(registry.keyFor('msg-2')).toBe('w2');
    expect(registry.hasRegistered('w2')).toBe(true);
    registry.forgetUnmounted();
    expect(registry.keyFor('msg-1')).toBe('w1');
    expect(registry.idFor('w1')).toBe('msg-1');
    expect(registry.hasRegistered('w1')).toBe(true);
    expect(registry.keyFor('msg-2')).toBe('msg-2');
    expect(registry.hasRegistered('w2')).toBe(false);
    registry.register('w1', { ...entry, id: 'msg-3' });
    expect(registry.keyFor('msg-1')).toBe('msg-1');
    expect(registry.keyFor('msg-3')).toBe('w1');
  });
});

describe('ChatTranscript conversation reset', () => {
  /** A virtualized conversation of `count` messages whose ids start with `prefix`. */
  function Conversation({ prefix, count }: { prefix: string; count: number }) {
    return (
      <ChatTranscript aria-label="Conversation" virtualized>
        {Array.from({ length: count }, (_, index) => (
          <ChatMessage key={`${prefix}${index}`} id={`${prefix}${index}`} author={ana}>
            Message {index}
          </ChatMessage>
        ))}
      </ChatTranscript>
    );
  }

  it('UIC-CHAT-TRANSCRIPT-1.6 estimates the next conversation from its own measured heights only', () => {
    const sizes = installTranscriptLayout({ viewportHeight: 400, messageHeight: 200 });
    const { rerender } = render(<Conversation prefix="old-" count={300} />);
    sizes.messageHeight = 50;
    rerender(<Conversation prefix="new-" count={300} />);
    expect(getViewport().scrollHeight).toBe(300 * 50);
  });
});
